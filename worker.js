
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));

  return Array.from(bytes, b =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest), b =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

// ==========================================
// USER AUTHENTICATION - PASSWORD SECURITY
// ==========================================

const PASSWORD_ITERATIONS = 100000;

function randomSalt() {
  return randomToken();
}

async function hashPassword(
  password,
  salt,
  iterations = PASSWORD_ITERATIONS
) {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: iterations,
      hash: "SHA-256"
    },
    key,
    256
  );

  return Array.from(
    new Uint8Array(bits),
    b => b.toString(16).padStart(2, "0")
  ).join("");
}

function secureEqual(a, b) {
  if (
    typeof a !== "string" ||
    typeof b !== "string" ||
    a.length !== b.length
  ) {
    return false;
  }

  let difference = 0;

  for (let i = 0; i < a.length; i++) {
    difference |=
      a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return difference === 0;
}

function validUsername(username) {
  return /^[a-zA-Z0-9_.-]{3,40}$/.test(
    username
  );
}

function validPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 12 &&
    password.length <= 128
  );
}

// ==========================================
// END PASSWORD SECURITY
// ==========================================


// Read a small JSON request safely.
async function readJSON(request, maxLength = 65536) {
  const length = Number(
    request.headers.get("content-length")
  );

  if (length > maxLength) {
    throw new Error("Request too large");
  }

  const raw = await request.text();

  if (raw.length > maxLength) {
    throw new Error("Request too large");
  }

  return JSON.parse(raw);
}

// Register a cashier device.
async function registerDevice(request, env) {
  if (!env.DB) {
    return json({ error: "D1 database not configured" }, 503);
  }

  let body;

  try {
    body = await readJSON(request, 4096);
  } catch {
    return json({ error: "Invalid registration request" }, 400);
  }

  const code = String(body?.code || "")
    .trim().toLowerCase();

  const deviceId = String(body?.deviceId || "").trim();

  if (!/^[a-f0-9]{48}$/.test(code) ||
      !/^POS-[A-Za-z0-9-]{1,40}$/.test(deviceId)) {
    return json({ error: "Invalid registration details" }, 400);
  }

  try {
    const token = randomToken();
    const tokenHash = await sha256(token);

    const result = await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO devices (device_id, token_hash)
        SELECT ?, ?
        WHERE EXISTS (
          SELECT 1 FROM registration_codes
          WHERE code = ? AND used_at IS NULL
        )
      `).bind(deviceId, tokenHash, code),

      env.DB.prepare(`
        UPDATE registration_codes
        SET used_at = CURRENT_TIMESTAMP
        WHERE code = ? AND used_at IS NULL
          AND EXISTS (
            SELECT 1 FROM devices
            WHERE device_id = ? AND token_hash = ?
          )
      `).bind(code, deviceId, tokenHash)
    ]);

    if (result[0].meta.changes !== 1 ||
        result[1].meta.changes !== 1) {
      return json({
        error: "Invalid code or device already registered"
      }, 403);
    }

    return json({
      success: true,
      deviceId,
      token
    });
  } catch {
    return json({
      error: "Device registration failed"
    }, 409);
  }
}

// Authenticate a registered device.
async function authenticateDevice(request, env) {
  const authorization =
    request.headers.get("Authorization") || "";

  const match = /^Bearer ([a-f0-9]{64})$/i.exec(
    authorization
  );

  if (!match) return null;

  const tokenHash = await sha256(match[1]);

  const device = await env.DB.prepare(`
    SELECT device_id
    FROM devices
    WHERE token_hash = ?
      AND revoked_at IS NULL
    LIMIT 1
  `).bind(tokenHash).first();

  return device || null;
}

// Upload one completed sale.
async function syncSale(request, env) {
  if (!env.DB) {
    return json({ error: "D1 database not configured" }, 503);
  }

  let device;

  try {
    device = await authenticateDevice(request, env);
  } catch {
    return json({ error: "Authentication unavailable" }, 503);
  }

  if (!device) {
    return json({ error: "Unauthorized device" }, 401);
  }

  let event;

  try {
    event = await readJSON(request);
  } catch {
    return json({ error: "Invalid sale request" }, 400);
  }

  const eventId = event?.id;
  const saleId = event?.saleId;
  const sale = event?.payload;

  if (
    event?.type !== "sale.completed" ||
    typeof eventId !== "string" ||
    typeof saleId !== "string" ||
    typeof sale !== "object" ||
    sale === null ||
    Array.isArray(sale) ||
    sale.id !== saleId ||
    eventId.length < 1 ||
    eventId.length > 128 ||
    saleId.length < 1 ||
    saleId.length > 128
  ) {
    return json({ error: "Invalid sale event" }, 400);
  }

 // POS stores monetary amounts as integer cents.
  // Preserve the exact amount without conversion.
  const totalCents = sale.totalCents;

  if (
    !Number.isSafeInteger(totalCents) ||
    totalCents < 0 ||
    totalCents > 10000000000
  ) {
    return json({ error: "Invalid sale total" }, 400);
  }

  const createdAt = sale.createdAt ||
    event.createdAt;

  if (
    typeof createdAt !== "string" ||
    !Number.isFinite(Date.parse(createdAt))
  ) {
    return json({ error: "Invalid sale date" }, 400);
  }

  const payloadJSON = JSON.stringify(sale);

  try {
    // First check for an already-saved sale.
    const existing = await env.DB.prepare(`
      SELECT sale_id, event_id, device_id
      FROM sales
      WHERE sale_id = ? OR event_id = ?
      LIMIT 1
    `).bind(saleId, eventId).first();

    if (existing) {
      if (
        existing.sale_id === saleId &&
        existing.event_id === eventId &&
        existing.device_id === device.device_id
      ) {
        return json({
          success: true,
          acknowledgedEventId: eventId,
          saleId,
          duplicate: true
        });
      }

      return json({
        error: "Conflicting sale or event ID"
      }, 409);
    }

    await env.DB.prepare(`
      INSERT INTO sales (
        sale_id,
        event_id,
        device_id,
        created_at,
        currency,
        total_cents,
        payload_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      saleId,
      eventId,
      device.device_id,
      createdAt,
      "LKR",
      totalCents,
      payloadJSON
    ).run();

    return json({
      success: true,
      acknowledgedEventId: eventId,
      saleId,
      duplicate: false
    });
  } catch {
    // A concurrent retry may have inserted the sale.
    try {
      const existing = await env.DB.prepare(`
        SELECT sale_id, event_id, device_id
        FROM sales
        WHERE sale_id = ? OR event_id = ?
        LIMIT 1
      `).bind(saleId, eventId).first();

      if (
        existing &&
        existing.sale_id === saleId &&
        existing.event_id === eventId &&
        existing.device_id === device.device_id
      ) {
        return json({
          success: true,
          acknowledgedEventId: eventId,
          saleId,
          duplicate: true
        });
      }
    } catch {
      // Keep the event pending on the client.
    }

    return json({
      error: "Sale could not be synchronized"
    }, 503);
  }
}


// ==========================================
// CREATE FIRST ADMINISTRATOR
// ==========================================

async function setupAdmin(request, env) {
  if (!env.DB || !env.ADMIN_SETUP_SECRET) {
    return json({
      error: "Administrator setup unavailable"
    }, 503);
  }

  const suppliedSecret =
    request.headers.get("X-Setup-Secret") || "";

  if (
    !suppliedSecret ||
    !secureEqual(
      await sha256(suppliedSecret),
      await sha256(env.ADMIN_SETUP_SECRET)
    )
  ) {
    return json({
      error: "Unauthorized setup request"
    }, 403);
  }

  try {
    const existingAdmin = await env.DB.prepare(`
      SELECT user_id
      FROM users
      WHERE role = 'admin'
      LIMIT 1
    `).first();

    if (existingAdmin) {
      return json({
        error: "Administrator already exists"
      }, 409);
    }

    let body;

    try {
      body = await readJSON(request, 4096);
    } catch {
      return json({
        error: "Invalid request"
      }, 400);
    }

    const username = String(
      body?.username || ""
    ).trim().toLowerCase();

    const fullName = String(
      body?.fullName || ""
    ).trim();

    const password = body?.password;

    if (
      !validUsername(username) ||
      !validPassword(password) ||
      !fullName ||
      fullName.length > 100
    ) {
      return json({
        error: "Invalid account details"
      }, 400);
    }

    const userId = crypto.randomUUID();
    const salt = randomSalt();

    const passwordHash = await hashPassword(
      password,
      salt
    );

    const result = await env.DB.prepare(`
      INSERT INTO users (
        user_id,
        username,
        full_name,
        password_hash,
        password_salt,
        password_iterations,
        role,
        is_active
      )
      SELECT ?, ?, ?, ?, ?, ?, 'admin', 1
      WHERE NOT EXISTS (
        SELECT 1
        FROM users
        WHERE role = 'admin'
      )
    `).bind(
      userId,
      username,
      fullName,
      passwordHash,
      salt,
      PASSWORD_ITERATIONS
    ).run();

    if (result.meta.changes !== 1) {
      return json({
        error: "Administrator already exists"
      }, 409);
    }

    return json({
      success: true,
      message: "Administrator created successfully",
      user: {
        userId,
        username,
        fullName,
        role: "admin"
      }
    }, 201);

  } catch {
    return json({
      error: "Administrator creation failed"
    }, 503);
  }
}

// ==========================================
// END ADMINISTRATOR SETUP
// ==========================================


// ==========================================
// USER LOGIN AND SESSION MANAGEMENT
// ==========================================

const SESSION_DURATION = 12 * 60 * 60 * 1000;

function publicUser(user) {
  return {
    userId: user.user_id,
    username: user.username,
    fullName: user.full_name,
    role: user.role
  };
}

// ------------------------------------------
// USER LOGIN
// ------------------------------------------

async function loginUser(request, env) {
  if (!env.DB) {
    return json({
      error: "Database unavailable"
    }, 503);
  }

  let body;

  try {
    body = await readJSON(request, 4096);
  } catch {
    return json({
      error: "Invalid login request"
    }, 400);
  }

  const username = String(
    body?.username || ""
  ).trim().toLowerCase();

  const password = body?.password;

  if (
    !validUsername(username) ||
    !validPassword(password)
  ) {
    return json({
      error: "Invalid username or password"
    }, 401);
  }

  try {
    const user = await env.DB.prepare(`
      SELECT *
      FROM users
      WHERE username = ?
      LIMIT 1
    `).bind(username).first();

    if (!user || !user.is_active) {
      return json({
        error: "Invalid username or password"
      }, 401);
    }

    if (
      user.locked_until &&
      Date.parse(user.locked_until) > Date.now()
    ) {
      return json({
        error: "Account temporarily locked. Try again later."
      }, 429);
    }

    const passwordHash = await hashPassword(
      password,
      user.password_salt,
      user.password_iterations
    );

    if (!secureEqual(
      passwordHash,
      user.password_hash
    )) {

      const now = new Date().toISOString();

      await env.DB.prepare(`
        UPDATE users
        SET failed_attempts =
          CASE
            WHEN locked_until IS NOT NULL
              AND locked_until <= ?
            THEN 1
            ELSE failed_attempts + 1
          END,
          locked_until =
          CASE
            WHEN locked_until > ?
            THEN locked_until
            WHEN locked_until IS NOT NULL
              AND locked_until <= ?
            THEN NULL
            WHEN failed_attempts + 1 >= 5
            THEN ?
            ELSE NULL
          END
        WHERE user_id = ?
      `).bind(
        now,
        now,
        now,
        new Date(
          Date.now() + 15 * 60 * 1000
        ).toISOString(),
        user.user_id
      ).run();

      return json({
        error: "Invalid username or password"
      }, 401);
    }

    const token = randomToken();
    const tokenHash = await sha256(token);
    const sessionId = crypto.randomUUID();

    const expiresAt = new Date(
      Date.now() + SESSION_DURATION
    ).toISOString();

    const result = await env.DB.batch([

      env.DB.prepare(`
        INSERT INTO user_sessions (
          session_id,
          user_id,
          token_hash,
          expires_at
        )
        SELECT ?, user_id, ?, ?
        FROM users
        WHERE user_id = ?
          AND is_active = 1
          AND (
            locked_until IS NULL
            OR locked_until <= ?
          )
      `).bind(
        sessionId,
        tokenHash,
        expiresAt,
        user.user_id,
        new Date().toISOString()
      ),

      env.DB.prepare(`
        UPDATE users
        SET failed_attempts = 0,
            locked_until = NULL,
            last_login = CURRENT_TIMESTAMP
        WHERE user_id = ?
          AND EXISTS (
            SELECT 1 FROM user_sessions
            WHERE session_id = ?
              AND user_id = users.user_id
          )
      `).bind(user.user_id, sessionId)

    ]);

    if (result[0].meta.changes !== 1) {
      return json({
        error: "Login unavailable"
      }, 401);
    }

    return new Response(
      JSON.stringify({
        success: true,
        expiresAt,
        user: publicUser(user)
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "Set-Cookie":
            "__Host-pos_session=" + token +
            "; Path=/" +
            "; HttpOnly" +
            "; Secure" +
            "; SameSite=Strict" +
            "; Max-Age=43200"
        }
      }
    );

  } catch {
    return json({
      error: "Login service unavailable"
    }, 503);
  }
}

// ------------------------------------------
// EXTRACT USER SESSION COOKIE
// ------------------------------------------

function getUserSessionToken(request) {

  const cookies =
    request.headers.get("Cookie") || "";

  const match =
    /(?:^|;\s*)__Host-pos_session=([a-f0-9]{64})(?:;|$)/i
      .exec(cookies);

  return match ? match[1] : null;
}

// ------------------------------------------
// VERIFY USER SESSION
// ------------------------------------------

async function authenticateUser(request, env) {

  if (!env.DB) return null;

  const token = getUserSessionToken(request);

  if (!token) return null;

  const tokenHash = await sha256(token);

  const now = new Date().toISOString();

  const user = await env.DB.prepare(`
    SELECT
      u.user_id,
      u.username,
      u.full_name,
      u.role,
      s.session_id,
      s.expires_at
    FROM user_sessions s
    INNER JOIN users u
      ON u.user_id = s.user_id
    WHERE s.token_hash = ?
      AND s.revoked_at IS NULL
      AND s.expires_at > ?
      AND u.is_active = 1
    LIMIT 1
  `).bind(
    tokenHash,
    now
  ).first();

  return user || null;
}

// ------------------------------------------
// CURRENT LOGGED-IN USER
// ------------------------------------------

async function currentUser(request, env) {

  try {
    const user = await authenticateUser(
      request,
      env
    );

    if (!user) {
      return json({
        error: "Not authenticated"
      }, 401);
    }

    return json({
      success: true,
      user: publicUser(user),
      expiresAt: user.expires_at
    });

  } catch {
    return json({
      error: "Session verification unavailable"
    }, 503);
  }
}

// ------------------------------------------
// USER LOGOUT
// ------------------------------------------

async function logoutUser(request, env) {

  try {
    const token = getUserSessionToken(request);

    if (token) {

      const tokenHash = await sha256(token);

      await env.DB.prepare(`
        UPDATE user_sessions
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE token_hash = ?
          AND revoked_at IS NULL
      `).bind(tokenHash).run();

    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Logged out successfully"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "Set-Cookie":
            "__Host-pos_session=" +
            "; Path=/" +
            "; HttpOnly" +
            "; Secure" +
            "; SameSite=Strict" +
            "; Max-Age=0"
        }
      }
    );

  } catch {
    return json({
      error: "Logout failed"
    }, 503);
  }
}

// ------------------------------------------
// ADMINISTRATOR PERMISSION CHECK
// ------------------------------------------

async function requireAdmin(request, env) {

  const user = await authenticateUser(
    request,
    env
  );

  if (!user) {
    return {
      error: json({
        error: "Authentication required"
      }, 401)
    };
  }

  if (user.role !== "admin") {
    return {
      error: json({
        error: "Administrator access required"
      }, 403)
    };
  }

  return { user };
}

// ==========================================
// END USER AUTHENTICATION
// ==========================================


export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // First administrator setup
    if (url.pathname === "/api/auth/setup") {
      if (request.method !== "POST") {
        return json({
          error: "Method not allowed"
        }, 405);
      }

      return setupAdmin(request, env);
    }

    if (url.pathname === "/api/register") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }

      return registerDevice(request, env);
    }

    if (url.pathname === "/api/sync") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }

      return syncSale(request, env);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({
        error: "API endpoint not implemented"
      }, 404);
    }

    return env.ASSETS.fetch(request);
  }
};
