
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });

// ==========================================
// SECURITY UTILITIES
// ==========================================

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
      iterations,
      hash: "SHA-256"
    },
    key,
    256
  );

  return Array.from(new Uint8Array(bits), b =>
    b.toString(16).padStart(2, "0")
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
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return difference === 0;
}

function validUsername(username) {
  return /^[a-zA-Z0-9_.-]{3,40}$/.test(username);
}

function validPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 12 &&
    password.length <= 128
  );
}

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

// ==========================================
// CASHIER DEVICE REGISTRATION
// ==========================================

async function registerDevice(request, env) {
  if (!env.DB) {
    return json({
      error: "D1 database not configured"
    }, 503);
  }

  let body;

  try {
    body = await readJSON(request, 4096);
  } catch {
    return json({
      error: "Invalid registration request"
    }, 400);
  }

  const code = String(body?.code || "")
    .trim().toLowerCase();

  const deviceId = String(body?.deviceId || "").trim();

  if (
    !/^[a-f0-9]{48}$/.test(code) ||
    !/^POS-[A-Za-z0-9-]{1,40}$/.test(deviceId)
  ) {
    return json({
      error: "Invalid registration details"
    }, 400);
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
          AND datetime(created_at) BETWEEN datetime('now', '-15 minutes') AND datetime('now')
        )
      `).bind(deviceId, tokenHash, code),

      env.DB.prepare(`
        UPDATE registration_codes
        SET used_at = CURRENT_TIMESTAMP
        WHERE code = ? AND used_at IS NULL
          AND datetime(created_at) BETWEEN datetime('now', '-15 minutes') AND datetime('now')
          AND EXISTS (
            SELECT 1 FROM devices
            WHERE device_id = ? AND token_hash = ?
          )
      `).bind(code, deviceId, tokenHash)
    ]);

    if (
      result[0].meta.changes !== 1 ||
      result[1].meta.changes !== 1
    ) {
      return json({
        error: "Invalid or expired code, or device already registered"
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

// ==========================================
// DEVICE AUTHENTICATION
// ==========================================

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

// ==========================================
// SALES SYNCHRONIZATION
// ==========================================

function validCashSale(sale) {
  if (sale.currency !== "LKR" || sale.paymentMethod !== "cash" ||
      !Array.isArray(sale.items) || !sale.items.length ||
      !Number.isSafeInteger(sale.receivedCents) || sale.receivedCents < sale.totalCents ||
      !Number.isSafeInteger(sale.changeCents) || sale.changeCents !== sale.receivedCents - sale.totalCents) return false;
  let sum = 0;
  const ids = new Set();
  for (const item of sale.items) {
    if (!item || typeof item.id !== "string" || !item.id || ids.has(item.id) ||
        !Number.isSafeInteger(item.qty) || item.qty < 1 || item.qty > 999 ||
        !Number.isSafeInteger(item.price) || item.price < 0) return false;
    ids.add(item.id);
    sum += item.qty * item.price;
    if (!Number.isSafeInteger(sum) || sum > 10000000000) return false;
  }
  return sum === sale.totalCents;
}

async function syncSale(request, env) {
  if (!env.DB) return json({error:"Database unavailable"},503);

  let device;
  try {
    device = await authenticateDevice(request,env);
  } catch {
    return json({error:"Authentication unavailable"},503);
  }

  if (!device) return json({error:"Unauthorized device"},401);

  let event;
  try {
    event = await readJSON(request);
  } catch {
    return json({error:"Invalid sale request"},400);
  }

  const eventId = event?.id;
  const saleId = event?.saleId;
  const sale = event?.payload;

  if (
    event?.type !== "sale.completed" ||
    typeof eventId !== "string" ||
    typeof saleId !== "string" ||
    !sale ||
    typeof sale !== "object" ||
    Array.isArray(sale) ||
    sale.id !== saleId ||
    eventId.length < 1 ||
    eventId.length > 128 ||
    saleId.length < 1 ||
    saleId.length > 128
  ) {
    return json({error:"Invalid sale event"},400);
  }

  const totalCents = sale.totalCents;
  const createdAt = sale.createdAt || event.createdAt;

  if (
    !Number.isSafeInteger(totalCents) ||
    totalCents < 0 ||
    totalCents > 10000000000
  ) {
    return json({error:"Invalid sale total"},400);
  }

  if (
    typeof createdAt !== "string" ||
    !Number.isFinite(Date.parse(createdAt))
  ) {
    return json({error:"Invalid sale date"},400);
  }

  const payloadJSON = JSON.stringify(sale);

  async function findExisting() {
    const result = await env.DB.prepare(`
      SELECT sale_id,event_id,device_id,
             'recorded' AS location
      FROM sales
      WHERE sale_id=? OR event_id=?

      UNION ALL

      SELECT sale_id,event_id,device_id,
             'delayed' AS location
      FROM pos_late_sales ls
      WHERE (ls.sale_id=? OR ls.event_id=?)
        AND NOT (
          ls.status='approved'
          AND EXISTS (
            SELECT 1 FROM sales s
            WHERE s.sale_id=ls.sale_id
              AND s.event_id=ls.event_id
              AND s.device_id=ls.device_id
          )
        )
    `).bind(saleId,eventId,saleId,eventId).all();

    return result.results || [];
  }

  function acknowledge(rows,duplicate) {
    if (!rows.length) return null;

    const row = rows[0];

    if (
      rows.length !== 1 ||
      row.sale_id !== saleId ||
      row.event_id !== eventId ||
      row.device_id !== device.device_id
    ) {
      return json({error:"Conflicting sale or event ID"},409);
    }

    const delayed = row.location === "delayed";

    return json({
      success:true,
      acknowledgedEventId:eventId,
      saleId,
      duplicate,
      delayed,
      warning:delayed
        ? "Sale preserved for administrator reconciliation"
        : null
    });
  }

  try {
    const existing = acknowledge(await findExisting(),true);
    if (existing) return existing;

    if (!validCashSale(sale)) {
      return json({error:"Invalid sale items or cash amounts"},422);
    }

    const assignment = await env.DB.prepare(`
      SELECT o.outlet_id
      FROM outlet_terminals t
      JOIN outlets o ON o.outlet_id=t.outlet_id
      WHERE t.device_id=?
        AND t.is_active=1
        AND o.is_active=1
      LIMIT 1
    `).bind(device.device_id).first();

    if (!assignment) {
      return json({error:"Device has no active outlet assignment"},403);
    }

    if (
      typeof sale.shiftId !== "string" ||
      !/^[a-f0-9-]{36}$/i.test(sale.shiftId)
    ) {
      return json({error:"Sale requires a valid shift ID"},422);
    }

    const shift = await env.DB.prepare(`
      SELECT s.shift_id
      FROM pos_shifts s
      JOIN users u ON u.user_id=s.cashier_id
      JOIN outlet_users ou
        ON ou.user_id=s.cashier_id
        AND ou.outlet_id=s.outlet_id
      WHERE s.shift_id=?
        AND s.outlet_id=?
        AND s.device_id=?
        AND u.role='cashier'
        AND datetime(?)>=datetime(s.opened_at)
        AND (
          s.closed_at IS NULL
          OR datetime(?)<=datetime(s.closed_at)
        )
      LIMIT 1
    `).bind(
      sale.shiftId,
      assignment.outlet_id,
      device.device_id,
      createdAt,
      createdAt
    ).first();

    if (!shift) {
      return json({
        error:"Sale does not belong to this outlet shift or shift time"
      },422);
    }

    const results = await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO sales(
          sale_id,event_id,device_id,created_at,
          currency,total_cents,payload_json,
          outlet_id,shift_id
        )
        SELECT ?,?,?,?,'LKR',?,?,outlet_id,shift_id
        FROM pos_shifts
        WHERE shift_id=?
          AND outlet_id=?
          AND device_id=?
          AND status='open'
          AND datetime(?)>=datetime(opened_at)
      `).bind(
        saleId,eventId,device.device_id,
        createdAt,totalCents,payloadJSON,
        shift.shift_id,assignment.outlet_id,
        device.device_id,createdAt
      ),

      env.DB.prepare(`
        INSERT INTO pos_late_sales(
          sale_id,event_id,device_id,created_at,
          currency,total_cents,payload_json,
          outlet_id,shift_id
        )
        SELECT ?,?,?,?,'LKR',?,?,outlet_id,shift_id
        FROM pos_shifts
        WHERE shift_id=?
          AND outlet_id=?
          AND device_id=?
          AND status='closed'
          AND datetime(?)>=datetime(opened_at)
          AND datetime(?)<=datetime(closed_at)
      `).bind(
        saleId,eventId,device.device_id,
        createdAt,totalCents,payloadJSON,
        shift.shift_id,assignment.outlet_id,
        device.device_id,createdAt,createdAt
      )
    ]);

    const recorded = results[0].meta.changes === 1;
    const delayed = results[1].meta.changes === 1;

    if (recorded === delayed) {
      return json({
        error:"Sale not recorded; verify shift status"
      },409);
    }

    return json({
      success:true,
      acknowledgedEventId:eventId,
      saleId,
      duplicate:false,
      delayed,
      warning:delayed
        ? "Sale preserved for administrator reconciliation"
        : null
    });

  } catch {
    try {
      const existing = acknowledge(await findExisting(),true);
      if (existing) return existing;
    } catch {}

    return json({
      error:"Sale could not be synchronized"
    },503);
  }
}

// ==========================================
// FIRST ADMINISTRATOR SETUP
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

// ==========================================
// SESSION COOKIE
// ==========================================

function getUserSessionToken(request) {
  const cookies =
    request.headers.get("Cookie") || "";

  const match =
    /(?:^|;\s*)__Host-pos_session=([a-f0-9]{64})(?:;|$)/i
      .exec(cookies);

  return match ? match[1] : null;
}

// ==========================================
// VERIFY USER SESSION
// ==========================================

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
  `).bind(tokenHash, now).first();

  return user || null;
}

// ==========================================
// CURRENT LOGGED-IN USER
// ==========================================

async function currentUser(request, env) {
  try {
    const user = await authenticateUser(request, env);

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

// ==========================================
// USER LOGOUT
// ==========================================

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

// ==========================================
// ADMINISTRATOR PERMISSION CHECK
// ==========================================

async function requireAdmin(request, env) {
  const user = await authenticateUser(request, env);

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
// ADMIN: CREATE CASHIER ACCOUNT
// ==========================================

async function createCashier(request, env) {
  if (!env.DB) {
    return json({
      error: "Database unavailable"
    }, 503);
  }

  let admin;

  try {
    admin = await requireAdmin(request, env);
  } catch {
    return json({
      error: "Authentication unavailable"
    }, 503);
  }

  if (admin.error) {
    return admin.error;
  }

  let body;

  try {
    body = await readJSON(request, 4096);
  } catch {
    return json({
      error: "Invalid request"
    }, 400);
  }

  const username = String(body?.username || "")
    .trim().toLowerCase();

  const fullName = String(body?.fullName || "").trim();

  const outletCode = String(body?.outletCode || "")
    .trim().toUpperCase();

  const password = body?.password;

  if (
    !validUsername(username) ||
    !validPassword(password) ||
    !fullName ||
    fullName.length > 100 ||
    !/^[A-Z0-9-]{3,20}$/.test(outletCode)
  ) {
    return json({
      error: "Invalid cashier account details"
    }, 400);
  }

  try {
    const outlet = await env.DB.prepare(`
      SELECT outlet_id
      FROM outlets
      WHERE outlet_code = ?
        AND is_active = 1
      LIMIT 1
    `).bind(outletCode).first();

    if (!outlet) {
      return json({
        error: "Active outlet not found"
      }, 404);
    }

    const existing = await env.DB.prepare(`
      SELECT user_id
      FROM users
      WHERE username = ?
      LIMIT 1
    `).bind(username).first();

    if (existing) {
      return json({
        error: "Username already exists"
      }, 409);
    }

    const userId = crypto.randomUUID();
    const salt = randomSalt();

    const passwordHash = await hashPassword(
      password,
      salt
    );

    // Both inserts run in one D1 batch.
    const results = await env.DB.batch([
      env.DB.prepare(`
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
        VALUES (?, ?, ?, ?, ?, ?, 'cashier', 1)
      `).bind(
        userId,
        username,
        fullName,
        passwordHash,
        salt,
        PASSWORD_ITERATIONS
      ),

      env.DB.prepare(`
        INSERT INTO outlet_users (
          outlet_id,
          user_id,
          is_active
        )
        VALUES (?, ?, 1)
      `).bind(
        outlet.outlet_id,
        userId
      )
    ]);

    if (
      results[0].meta.changes !== 1 ||
      results[1].meta.changes !== 1
    ) {
      return json({
        error: "Cashier account creation failed"
      }, 503);
    }

    return json({
      success: true,
      message: "Cashier account created",
      user: {
        userId,
        username,
        fullName,
        role: "cashier"
      },
      outletCode
    }, 201);

  } catch (error) {
    if (
      String(error?.message || "")
        .includes("UNIQUE constraint")
    ) {
      return json({
        error: "Username already exists"
      }, 409);
    }

    return json({
      error: "Cashier account creation failed"
    }, 503);
  }
}


// ==========================================
// ADMIN: RESET CASHIER PASSWORD
// ==========================================

async function resetCashierPassword(request, env) {
  if (!env.DB) {
    return json({ error: "Database unavailable" }, 503);
  }

  let admin;

  try {
    admin = await requireAdmin(request, env);
  } catch {
    return json({ error: "Authentication unavailable" }, 503);
  }

  if (admin.error) return admin.error;

  let body;

  try {
    body = await readJSON(request, 4096);
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const username = String(body?.username || "")
    .trim().toLowerCase();

  const newPassword = body?.newPassword;

  if (
    !validUsername(username) ||
    !validPassword(newPassword)
  ) {
    return json({
      error: "Invalid cashier username or password (12–128 characters required)"
    }, 400);
  }

  try {
    const cashier = await env.DB.prepare(`
      SELECT user_id
      FROM users
      WHERE username = ?
        AND role = 'cashier'
      LIMIT 1
    `).bind(username).first();

    if (!cashier) {
      return json({ error: "Cashier not found" }, 404);
    }

    const salt = randomSalt();
    const passwordHash = await hashPassword(
      newPassword,
      salt
    );

    // Update password and revoke existing cashier sessions.
    const results = await env.DB.batch([
      env.DB.prepare(`
        UPDATE users
        SET password_hash = ?,
            password_salt = ?,
            password_iterations = ?,
            failed_attempts = 0,
            locked_until = NULL
        WHERE user_id = ?
          AND role = 'cashier'
      `).bind(
        passwordHash,
        salt,
        PASSWORD_ITERATIONS,
        cashier.user_id
      ),

      env.DB.prepare(`
        DELETE FROM user_sessions
        WHERE user_id = ?
      `).bind(cashier.user_id)
    ]);

    if (results[0].meta.changes !== 1) {
      return json({
        error: "Cashier password reset failed"
      }, 503);
    }

    return json({
      success: true,
      message: "Cashier password reset successfully",
      username
    });

  } catch {
    return json({
      error: "Cashier password reset failed"
    }, 503);
  }
}


// ==========================================
// ADMIN: OUTLET MANAGEMENT
// ==========================================

// ==========================================
// ADMIN: ACTIVATE / DEACTIVATE OUTLET
// ==========================================

async function changeAdminOutletStatus(request, env) {
  if (!env.DB) {
    return json({ error: "Database unavailable" }, 503);
  }

  let admin;

  try {
    admin = await requireAdmin(request, env);
  } catch {
    return json({ error: "Authentication unavailable" }, 503);
  }

  if (admin.error) return admin.error;

  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON request" }, 400);
  }

  if (!body || typeof body !== "object" ||
      Array.isArray(body)) {
    return json({ error: "Invalid outlet data" }, 400);
  }

  if (typeof body.outletId !== "string" ||
      !body.outletId.trim() ||
      body.outletId.length > 100) {
    return json({ error: "Invalid outlet ID" }, 400);
  }

  if (body.isActive !== 0 && body.isActive !== 1) {
    return json({
      error: "isActive must be 0 or 1"
    }, 400);
  }

  const outletId = body.outletId.trim();
  const isActive = body.isActive;

  try {
    const existing = await env.DB.prepare(`
      SELECT outlet_id, outlet_code, outlet_name, is_active
      FROM outlets
      WHERE outlet_id = ?
    `).bind(outletId).first();

    if (!existing) {
      return json({ error: "Outlet not found" }, 404);
    }

    if (Number(existing.is_active) === isActive) {
      return json({
        success: true,
        message: "Outlet already has this status",
        outlet_code: existing.outlet_code,
        is_active: isActive
      });
    }

    // Do not deactivate outlets with active terminals.
    if (isActive === 0) {
      const terminal = await env.DB.prepare(`
        SELECT terminal_id
        FROM outlet_terminals
        WHERE outlet_id = ?
          AND is_active = 1
        LIMIT 1
      `).bind(outletId).first();

      if (terminal) {
        return json({
          error: "Cannot deactivate an outlet with active terminals"
        }, 409);
      }
    }

    const result = await env.DB.prepare(`
      UPDATE outlets
      SET is_active = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE outlet_id = ?
        AND (? = 1 OR NOT EXISTS (
          SELECT 1 FROM outlet_terminals
          WHERE outlet_terminals.outlet_id = outlets.outlet_id
            AND outlet_terminals.is_active = 1
        ))
    `).bind(isActive, outletId, isActive).run();

    if (!result.meta || result.meta.changes === 0) {
      return json({
        error: "Outlet status was not updated. Check whether active terminals are assigned."
      }, 409);
    }

    return json({
      success: true,
      message: isActive === 1
        ? "Outlet activated successfully"
        : "Outlet deactivated successfully",
      outlet_code: existing.outlet_code,
      is_active: isActive
    });

  } catch {
    return json({
      error: "Unable to change outlet status"
    }, 500);
  }
}

// ==========================================
// ADMIN: UPDATE OUTLET DETAILS
// ==========================================

async function updateAdminOutlet(request, env) {
  if (!env.DB) {
    return json({ error: "Database unavailable" }, 503);
  }

  let admin;

  try {
    admin = await requireAdmin(request, env);
  } catch {
    return json({ error: "Authentication unavailable" }, 503);
  }

  if (admin.error) {
    return admin.error;
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON request" }, 400);
  }

  if (!body || typeof body !== "object" ||
      Array.isArray(body)) {
    return json({ error: "Invalid outlet data" }, 400);
  }

  const fields = [
    "outletId",
    "outletName",
    "address",
    "phone",
    "email",
    "managerName"
  ];

  for (const field of fields) {
    if (body[field] !== undefined &&
        body[field] !== null &&
        typeof body[field] !== "string") {
      return json({
        error: "Invalid value for " + field
      }, 400);
    }
  }

  const outletId = (body.outletId || "").trim();
  const outletName = (body.outletName || "").trim();
  const address = (body.address || "").trim();
  const phone = (body.phone || "").trim();
  const email = (body.email || "").trim();
  const managerName = (body.managerName || "").trim();

  if (!outletId || outletId.length > 100) {
    return json({ error: "Invalid outlet ID" }, 400);
  }

  if (outletName.length < 2 ||
      outletName.length > 100) {
    return json({
      error: "Outlet name must contain 2-100 characters"
    }, 400);
  }

  if (address.length > 250 ||
      phone.length > 30 ||
      email.length > 150 ||
      managerName.length > 100) {
    return json({
      error: "One or more outlet fields are too long"
    }, 400);
  }

  if (email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Invalid email address" }, 400);
  }

  try {
    const result = await env.DB.prepare(`
      UPDATE outlets
      SET
        outlet_name = ?,
        address = ?,
        phone = ?,
        email = ?,
        manager_name = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE outlet_id = ?
    `).bind(
      outletName,
      address || null,
      phone || null,
      email || null,
      managerName || null,
      outletId
    ).run();

    if (!result.meta || result.meta.changes === 0) {
      return json({ error: "Outlet not found" }, 404);
    }

    return json({
      success: true,
      message: "Outlet updated successfully",
      outlet_id: outletId
    });

  } catch {
    return json({
      error: "Unable to update outlet"
    }, 500);
  }
}

// ==========================================
// ADMIN: CREATE NEW OUTLET
// ==========================================

async function createAdminOutlet(request, env) {
  if (!env.DB) {
    return json({ error: "Database unavailable" }, 503);
  }

  let admin;

  try {
    admin = await requireAdmin(request, env);
  } catch {
    return json({ error: "Authentication unavailable" }, 503);
  }

  if (admin.error) {
    return admin.error;
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON request" }, 400);
  }

  if (!body || typeof body !== "object" ||
      Array.isArray(body)) {
    return json({ error: "Invalid outlet data" }, 400);
  }

  const fields = [
    "outletCode",
    "outletName",
    "address",
    "phone",
    "email",
    "managerName"
  ];

  for (const field of fields) {
    if (body[field] !== undefined &&
        body[field] !== null &&
        typeof body[field] !== "string") {
      return json({
        error: "Invalid value for " + field
      }, 400);
    }
  }

  const outletCode = (body.outletCode || "")
    .trim().toUpperCase();

  const outletName = (body.outletName || "").trim();
  const address = (body.address || "").trim();
  const phone = (body.phone || "").trim();
  const email = (body.email || "").trim();
  const managerName = (body.managerName || "").trim();

  if (!/^[A-Z0-9-]{3,20}$/.test(outletCode)) {
    return json({
      error: "Outlet code must contain 3-20 letters, numbers or hyphens"
    }, 400);
  }

  if (outletName.length < 2 || outletName.length > 100) {
    return json({
      error: "Outlet name must contain 2-100 characters"
    }, 400);
  }

  if (address.length > 250 ||
      phone.length > 30 ||
      email.length > 150 ||
      managerName.length > 100) {
    return json({
      error: "One or more outlet fields are too long"
    }, 400);
  }

  if (email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({
      error: "Invalid email address"
    }, 400);
  }

  const outletId = crypto.randomUUID();

  try {
    await env.DB.prepare(`
      INSERT INTO outlets (
        outlet_id,
        outlet_code,
        outlet_name,
        address,
        phone,
        email,
        manager_name,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      outletId,
      outletCode,
      outletName,
      address || null,
      phone || null,
      email || null,
      managerName || null
    ).run();

    return json({
      success: true,
      message: "Outlet created successfully",
      outlet: {
        outlet_id: outletId,
        outlet_code: outletCode,
        outlet_name: outletName,
        is_active: 1
      }
    }, 201);

  } catch (error) {
    const message = String(error?.message || "");

    if (message.includes("UNIQUE constraint failed")) {
      return json({
        error: "Outlet code already exists"
      }, 409);
    }

    return json({
      error: "Unable to create outlet"
    }, 500);
  }
}

// ==========================================
// ADMIN: LIST ALL OUTLETS
// ==========================================

async function listAdminOutlets(request, env) {
  if (!env.DB) {
    return json({
      error: "Database unavailable"
    }, 503);
  }

  const admin = await requireAdmin(request, env);

  if (admin.error) {
    return admin.error;
  }

  try {
    const result = await env.DB.prepare(`
      SELECT
        outlet_id,
        outlet_code,
        outlet_name,
        address,
        phone,
        email,
        manager_name,
        is_active,
        created_at,
        updated_at
      FROM outlets
      ORDER BY outlet_code
    `).all();

    return json({
      success: true,
      outlets: result.results || []
    });

  } catch {
    return json({
      error: "Unable to retrieve outlets"
    }, 500);
  }
}

// ==========================================
// ADMIN: OUTLET SALES SUMMARY
// ==========================================

async function getOutletSalesSummary(request, env) {
  if (!env.DB) {
    return json({
      error: "Database unavailable"
    }, 503);
  }

  let admin;

  try {
    admin = await requireAdmin(request, env);
  } catch {
    return json({
      error: "Authentication unavailable"
    }, 503);
  }

  if (admin.error) {
    return admin.error;
  }

  try {
    const result = await env.DB.prepare(`
      SELECT
        o.outlet_id,
        o.outlet_code,
        o.outlet_name,
        COUNT(s.sale_id) AS total_sales,
        COALESCE(SUM(s.total_cents), 0)
          AS total_revenue_cents
      FROM outlets o
      LEFT JOIN sales s
        ON s.outlet_id = o.outlet_id
      GROUP BY
        o.outlet_id,
        o.outlet_code,
        o.outlet_name
      ORDER BY o.outlet_code
    `).all();

    return json({
      success: true,
      outlets: result.results || []
    });

  } catch {
    return json({
      error: "Unable to load outlet sales"
    }, 503);
  }
}


// INTEGRATED ADMIN OPERATIONS (requires migrations/001_operations.sql)
async function adminOperations(request, env, kind) {
  if (!env.DB) return json({error:"Database unavailable"},503);
  let auth;
  try { auth=await requireAdmin(request,env); } catch {return json({error:"Authentication unavailable"},503);}
  if(auth.error) return auth.error;
  const method=request.method;
  let b={};
  if(method!=="GET") {
    try { b=await readJSON(request,16384); } catch {return json({error:"Invalid JSON"},400);}
    if(!b||typeof b!=="object"||Array.isArray(b))return json({error:"Invalid request"},400);
  }
  const id=x=>typeof x==="string"&&x.length>0&&x.length<=100&&/^[a-zA-Z0-9_-]+$/.test(x);
  const integer=x=>Number.isSafeInteger(x)&&x>=0&&x<=1000000000;
  const active=x=>x===0||x===1;
  try {
    if(kind==="registration-code" && method==="POST") {
      const code=Array.from(crypto.getRandomValues(new Uint8Array(24)), b=>b.toString(16).padStart(2,"0")).join("");
      await env.DB.prepare("INSERT INTO registration_codes(code) VALUES(?)").bind(code).run();
      return json({success:true,code,expiresInSeconds:900},201);
    }
    if(kind==="devices" && method==="GET") {
      return json({success:true,devices:(await env.DB.prepare("SELECT device_id,revoked_at FROM devices ORDER BY device_id").all()).results});
    }
    if(kind==="terminals") {
      if(method==="GET") {
        const rows=await env.DB.prepare(`SELECT t.terminal_id,t.terminal_name,t.device_id,t.outlet_id,t.is_active,o.outlet_name,d.revoked_at FROM outlet_terminals t JOIN outlets o ON o.outlet_id=t.outlet_id LEFT JOIN devices d ON d.device_id=t.device_id ORDER BY o.outlet_name,t.terminal_name`).all();
        return json({success:true,terminals:rows.results});
      }
      if(method==="POST") {
        if(!id(b.deviceId)||!id(b.outletId)||typeof b.terminalName!=="string"||!b.terminalName.trim()||b.terminalName.length>100)return json({error:"Invalid terminal details"},400);
        const device=await env.DB.prepare(`SELECT device_id FROM devices WHERE device_id=? AND revoked_at IS NULL`).bind(b.deviceId).first();
        const outlet=await env.DB.prepare(`SELECT outlet_id FROM outlets WHERE outlet_id=? AND is_active=1`).bind(b.outletId).first();
        if(!device||!outlet)return json({error:"Active device or outlet not found"},404);
        await env.DB.prepare(`INSERT INTO outlet_terminals(terminal_id,outlet_id,device_id,terminal_name) VALUES(?,?,?,?)`).bind(crypto.randomUUID(),b.outletId,b.deviceId,b.terminalName.trim()).run();
        return json({success:true});
      }
      if(method==="PATCH") {
        if(!id(b.terminalId)||!active(b.isActive))return json({error:"Invalid terminal status"},400);
        const r=await env.DB.prepare(`UPDATE outlet_terminals SET is_active=? WHERE terminal_id=? AND (?=0 OR EXISTS(SELECT 1 FROM outlets WHERE outlet_id=outlet_terminals.outlet_id AND is_active=1))`).bind(b.isActive,b.terminalId,b.isActive).run();
        return r.meta.changes?json({success:true}):json({error:"Terminal not found or outlet inactive"},409);
      }
    }
    if(kind==="cashiers") {
      if(method==="GET") {
        const rows=await env.DB.prepare(`SELECT u.user_id,u.username,u.full_name,u.is_active,o.outlet_id,o.outlet_name,ou.is_active AS assignment_active FROM users u LEFT JOIN outlet_users ou ON ou.user_id=u.user_id LEFT JOIN outlets o ON o.outlet_id=ou.outlet_id WHERE u.role='cashier' ORDER BY u.username,o.outlet_name`).all();
        return json({success:true,cashiers:rows.results});
      }
      if(method==="PATCH") {
        if(!id(b.userId)||!active(b.isActive))return json({error:"Invalid cashier status"},400);
        const r=await env.DB.prepare(`UPDATE users SET is_active=? WHERE user_id=? AND role='cashier'`).bind(b.isActive,b.userId).run();
        return r.meta.changes?json({success:true}):json({error:"Cashier not found"},404);
      }
    }
    if(kind==="assignments") {
      if(method==="POST") {
        if(!id(b.userId)||!id(b.outletId))return json({error:"Invalid assignment"},400);
        const u=await env.DB.prepare(`SELECT user_id FROM users WHERE user_id=? AND role='cashier' AND is_active=1`).bind(b.userId).first();
        const o=await env.DB.prepare(`SELECT outlet_id FROM outlets WHERE outlet_id=? AND is_active=1`).bind(b.outletId).first();
        if(!u||!o)return json({error:"Active cashier or outlet not found"},404);
        await env.DB.prepare(`INSERT INTO outlet_users(outlet_id,user_id,is_active) VALUES(?,?,1) ON CONFLICT(outlet_id,user_id) DO UPDATE SET is_active=1`).bind(b.outletId,b.userId).run();
        return json({success:true});
      }
      if(method==="PATCH") {
        if(!id(b.userId)||!id(b.outletId)||!active(b.isActive))return json({error:"Invalid assignment"},400);
        const r=await env.DB.prepare(`UPDATE outlet_users SET is_active=? WHERE user_id=? AND outlet_id=?`).bind(b.isActive,b.userId,b.outletId).run();
        return r.meta.changes?json({success:true}):json({error:"Assignment not found"},404);
      }
    }
    if(kind==="categories") {
      if(method==="GET")return json({success:true,categories:(await env.DB.prepare(`SELECT * FROM pos_categories ORDER BY name`).all()).results});
      if(method==="POST") {
        if(typeof b.name!=="string"||!b.name.trim()||b.name.length>80)return json({error:"Invalid category name"},400);
        await env.DB.prepare(`INSERT INTO pos_categories(category_id,name) VALUES(?,?)`).bind(crypto.randomUUID(),b.name.trim()).run();return json({success:true});
      }
      if(method==="PATCH") {
        if(!id(b.categoryId)||typeof b.name!=="string"||!b.name.trim()||b.name.length>80)return json({error:"Invalid category"},400);
        const r=await env.DB.prepare(`UPDATE pos_categories SET name=? WHERE category_id=?`).bind(b.name.trim(),b.categoryId).run();return r.meta.changes?json({success:true}):json({error:"Category not found"},404);
      }
    }
    if(kind==="products") {
      if(method==="GET")return json({success:true,products:(await env.DB.prepare(`SELECT p.*,c.name AS category_name FROM pos_products p LEFT JOIN pos_categories c ON c.category_id=p.category_id ORDER BY p.name`).all()).results});
      if(method==="POST") {
        if(typeof b.name!=="string"||!b.name.trim()||b.name.length>120||!integer(b.priceCents)|| (b.categoryId!==undefined&&b.categoryId!==null&&!id(b.categoryId)))return json({error:"Invalid product"},400);
        await env.DB.prepare(`INSERT INTO pos_products(product_id,name,category_id,price_cents) VALUES(?,?,?,?)`).bind(crypto.randomUUID(),b.name.trim(),b.categoryId||null,b.priceCents).run();return json({success:true});
      }
      if(method==="PATCH") {
        if(!id(b.productId)||typeof b.name!=="string"||!b.name.trim()||b.name.length>120||!integer(b.priceCents)||!active(b.isActive)||(b.categoryId!=null&&!id(b.categoryId)))return json({error:"Invalid product"},400);
        const r=await env.DB.prepare(`UPDATE pos_products SET name=?,price_cents=?,is_active=?,category_id=COALESCE(?,category_id),updated_at=CURRENT_TIMESTAMP WHERE product_id=?`).bind(b.name.trim(),b.priceCents,b.isActive,b.categoryId||null,b.productId).run();return r.meta.changes?json({success:true}):json({error:"Product not found"},404);
      }
    }
    if(kind==="prices") {
      if(method==="GET")return json({success:true,prices:(await env.DB.prepare(`SELECT * FROM pos_outlet_prices ORDER BY outlet_id,product_id`).all()).results});
      if(method==="POST") {
        if(!id(b.outletId)||!id(b.productId)||!integer(b.priceCents))return json({error:"Invalid price"},400);
        await env.DB.prepare(`INSERT INTO pos_outlet_prices(outlet_id,product_id,price_cents) VALUES(?,?,?) ON CONFLICT(outlet_id,product_id) DO UPDATE SET price_cents=excluded.price_cents`).bind(b.outletId,b.productId,b.priceCents).run();return json({success:true});
      }
    }
    if(kind==="shifts") {
      if(method==="GET")return json({success:true,shifts:(await env.DB.prepare(`SELECT s.*,u.username,o.outlet_name FROM pos_shifts s JOIN users u ON u.user_id=s.cashier_id JOIN outlets o ON o.outlet_id=s.outlet_id ORDER BY s.opened_at DESC LIMIT 100`).all()).results});
      if(method==="POST") {
        if(!id(b.cashierId)||!id(b.outletId)||!integer(b.openingCents))return json({error:"Invalid shift"},400);
        const assigned=await env.DB.prepare(`SELECT 1 FROM outlet_users ou JOIN users u ON u.user_id=ou.user_id JOIN outlets o ON o.outlet_id=ou.outlet_id WHERE ou.user_id=? AND ou.outlet_id=? AND ou.is_active=1 AND u.is_active=1 AND u.role='cashier' AND o.is_active=1`).bind(b.cashierId,b.outletId).first();
        if(!assigned)return json({error:"Cashier not assigned to active outlet"},403);
        const shiftId=crypto.randomUUID();
        await env.DB.prepare(`INSERT INTO pos_shifts(shift_id,outlet_id,cashier_id,opening_cents) VALUES(?,?,?,?)`).bind(shiftId,b.outletId,b.cashierId,b.openingCents).run();return json({success:true,shiftId});
      }
      if(method==="PATCH") {
        return json({error:"Close shifts through cashier denomination settlement"},409);
      }
    }
    if(kind==="cash-movements") {
      if(method==="GET")return json({success:true,movements:(await env.DB.prepare(`SELECT * FROM pos_cash_movements ORDER BY created_at DESC LIMIT 100`).all()).results});
      if(method==="POST") {
        if(!id(b.shiftId)||!integer(b.amountCents)||b.amountCents===0||!["cash_in","cash_out"].includes(b.type)||typeof b.reason!=="string"||!b.reason.trim()||b.reason.length>250)return json({error:"Invalid cash movement"},400);
        const open=await env.DB.prepare(`SELECT shift_id FROM pos_shifts WHERE shift_id=? AND status='open'`).bind(b.shiftId).first();if(!open)return json({error:"Shift not open"},409);
        await env.DB.prepare(`INSERT INTO pos_cash_movements(movement_id,shift_id,type,amount_cents,reason) VALUES(?,?,?,?,?)`).bind(crypto.randomUUID(),b.shiftId,b.type,b.amountCents,b.reason.trim()).run();return json({success:true});
      }
    }
    if(kind==="late-sales") {
      if(method==="GET") {
        const result=await env.DB.prepare(`
          SELECT ls.sale_id,ls.event_id,ls.device_id,
                 ls.shift_id,ls.created_at,ls.received_at,
                 ls.total_cents,ls.status,ls.review_reason,
                 ls.reviewed_at,ls.payload_json,
                 o.outlet_code,
                 u.username AS reviewer,
                 st.status AS settlement_status
          FROM pos_late_sales ls
          JOIN outlets o ON o.outlet_id=ls.outlet_id
          LEFT JOIN users u ON u.user_id=ls.reviewed_by
          LEFT JOIN pos_settlements st ON st.shift_id=ls.shift_id
          ORDER BY CASE WHEN ls.status='pending' THEN 0 ELSE 1 END,
                   ls.received_at DESC
          LIMIT 200
        `).all();

        const summary=await env.DB.prepare(`
          SELECT COUNT(*) AS pending_count,
                 COALESCE(SUM(total_cents),0) AS pending_cents
          FROM pos_late_sales
          WHERE status='pending'
        `).first();

        return json({
          success:true,
          lateSales:result.results||[],
          pendingCount:Number(summary.pending_count||0),
          pendingCents:Number(summary.pending_cents||0)
        });
      }

      if(method==="PATCH") {
        const reason=typeof b.reason==="string"?b.reason.trim():"";

        if(typeof b.saleId!=="string" ||
           !b.saleId.length ||
           b.saleId.length>128 ||
           !["approved","rejected"].includes(b.status) ||
           reason.length<3 ||
           reason.length>500) {
          return json({error:"A valid sale, decision and review reason are required"},400);
        }

        const result=await env.DB.prepare(`
          UPDATE pos_late_sales
          SET status=?,
              reviewed_at=CURRENT_TIMESTAMP,
              reviewed_by=?,
              review_reason=?
          WHERE sale_id=?
            AND status='pending'
        `).bind(
          b.status,
          auth.user.user_id,
          reason,
          b.saleId
        ).run();

        if(result.meta.changes!==1) {
          return json({error:"Transaction already reviewed or not found"},409);
        }

        return json({success:true,status:b.status});
      }

      return json({error:"Method not allowed"},405);
    }
    if(kind==="settlements") {
      if(method==="GET")return json({success:true,settlements:(await env.DB.prepare(`SELECT * FROM pos_settlements ORDER BY submitted_at DESC LIMIT 100`).all()).results});
      if(method==="POST") {
        if(!id(b.shiftId)||!Array.isArray(b.denominations)||b.denominations.length>30)return json({error:"Invalid settlement"},400);
        const shift=await env.DB.prepare(`SELECT * FROM pos_shifts WHERE shift_id=? AND status='closed'`).bind(b.shiftId).first();if(!shift)return json({error:"Shift must be closed"},409);
        let total=0;const counts=[];
        for(const d of b.denominations){if(!integer(d.valueCents)||d.valueCents===0||!Number.isSafeInteger(d.count)||d.count<0||d.count>100000)return json({error:"Invalid denomination"},400);total+=d.valueCents*d.count;counts.push({valueCents:d.valueCents,count:d.count});}
        if(!Number.isSafeInteger(total)||total>1000000000||total!==shift.counted_cents)return json({error:"Denomination total must match counted cash"},400);
        await env.DB.prepare(`INSERT INTO pos_settlements(settlement_id,shift_id,denominations_json,counted_cents) VALUES(?,?,?,?)`).bind(crypto.randomUUID(),b.shiftId,JSON.stringify(counts),total).run();return json({success:true});
      }
      if(method==="PATCH") {
        if(!id(b.settlementId)||!["approved","rejected"].includes(b.status))return json({error:"Invalid approval"},400);
        const reason=typeof b.reason==='string'?b.reason.trim():'';
        if(b.status==='rejected'&&(!reason||reason.length>500))return json({error:"Rejection reason required (maximum 500 characters)"},400);
        const r=await env.DB.prepare(`
          UPDATE pos_settlements
          SET status=?,reviewed_at=CURRENT_TIMESTAMP,
              reviewed_by=?,rejection_reason=?
          WHERE settlement_id=?
            AND status='pending'
            AND (
              ?='rejected'
              OR NOT EXISTS (
                SELECT 1 FROM pos_late_sales ls
                WHERE ls.shift_id=pos_settlements.shift_id
                  AND ls.status='pending'
              )
            )
        `).bind(
          b.status,
          auth.user.user_id,
          b.status==='rejected'?reason:null,
          b.settlementId,
          b.status
        ).run();

        return r.meta.changes
          ? json({success:true})
          : json({
              error:"Approval blocked: unresolved delayed sales or settlement is no longer pending."
            },409);
      }
    }
    if(kind==="reconciliation"&&method==="GET") {
      const rows=await env.DB.prepare(`
        SELECT sh.shift_id, sh.status, sh.opened_at, sh.closed_at,
          o.outlet_code, u.username AS cashier,
          sh.opening_cents, sh.counted_cents,
          COALESCE((SELECT SUM(s.total_cents) FROM sales s
            WHERE s.shift_id=sh.shift_id
            AND json_extract(s.payload_json,'$.paymentMethod')='cash'),0) AS cash_sales_cents,
          COALESCE((SELECT SUM(m.amount_cents) FROM pos_cash_movements m
            WHERE m.shift_id=sh.shift_id AND m.type='cash_in'),0) AS cash_in_cents,
          COALESCE((SELECT SUM(m.amount_cents) FROM pos_cash_movements m
            WHERE m.shift_id=sh.shift_id AND m.type='cash_out'),0) AS cash_out_cents,
          (SELECT status FROM pos_settlements st WHERE st.shift_id=sh.shift_id
            ORDER BY st.submitted_at DESC LIMIT 1) AS settlement_status
        FROM pos_shifts sh
        JOIN outlets o ON o.outlet_id=sh.outlet_id
        JOIN users u ON u.user_id=sh.cashier_id
        ORDER BY sh.opened_at DESC LIMIT 100
      `).all();
      const shifts=(rows.results||[]).map(r=>{
        const expectedCents=r.opening_cents+r.cash_sales_cents+r.cash_in_cents-r.cash_out_cents;
        return {...r,expected_cents:expectedCents,
          variance_cents:r.counted_cents===null?null:r.counted_cents-expectedCents};
      });
      const delayed=await env.DB.prepare(`
        SELECT COUNT(*) AS pending_count,
               COALESCE(SUM(total_cents),0) AS pending_cents
        FROM pos_late_sales
        WHERE status='pending'
      `).first();

      const pendingCount=Number(delayed?.pending_count||0);
      const pendingCents=Number(delayed?.pending_cents||0);

      const warning=pendingCount>0
        ? `ATTENTION: ${pendingCount} delayed sale(s) totaling LKR ${(pendingCents/100).toFixed(2)} require administrator reconciliation. These sales are excluded from normal revenue and settlement totals.`
        : "Expected cash includes synchronized cash sales only. Confirm all terminals have synced before approving.";

      return json({
        success:true,
        shifts,
        delayed_sales_count:pendingCount,
        delayed_sales_cents:pendingCents,
        warning
      });
    }
    if(kind==="reports"&&method==="GET") {
      const outlets=(await env.DB.prepare(`SELECT o.outlet_code,o.outlet_name,COUNT(s.sale_id) AS sales,COALESCE(SUM(s.total_cents),0) AS revenue_cents FROM outlets o LEFT JOIN sales s ON s.outlet_id=o.outlet_id GROUP BY o.outlet_id ORDER BY o.outlet_code`).all()).results;
      const cashiers=(await env.DB.prepare(`SELECT u.username,COUNT(sh.shift_id) AS shifts FROM users u LEFT JOIN pos_shifts sh ON sh.cashier_id=u.user_id WHERE u.role='cashier' GROUP BY u.user_id ORDER BY u.username`).all()).results;
      return json({success:true,outlets,cashiers});
    }
    return json({error:"Method not allowed"},405);
  } catch(e) {return json({error:"Operation failed. Confirm migrations are applied and input is valid.",detail:String(e.message||e).slice(0,160)},500);}
}


 // ==========================================
 // CASHIER: OPEN SHIFT
 // ==========================================

async function openCashierShift(request, env) {
  if (!env.DB) {
    return json({ error: "Database unavailable" }, 503);
  }

  let user;

  try {
    user = await authenticateUser(request, env);
  } catch {
    return json({ error: "Authentication unavailable" }, 503);
  }

  if (!user) {
    return json({ error: "Authentication required" }, 401);
  }

  if (user.role !== "cashier") {
    return json({ error: "Cashier access required" }, 403);
  }

  if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) {
    return json({ error: "JSON content type required" }, 415);
  }
  let body;

  try {
    body = await readJSON(request, 4096);
  } catch {
    return json({ error: "Invalid JSON request" }, 400);
  }

  const outletCode = body?.outletCode;
  const openingCents = body?.openingCents;

  if (
    typeof outletCode !== "string" ||
    !/^[A-Z0-9-]{3,20}$/.test(outletCode) ||
    !Number.isSafeInteger(openingCents) ||
    openingCents < 0 ||
    openingCents > 1000000000
  ) {
    return json({ error: "Invalid shift details" }, 400);
  }

  try {
    const outlet = await env.DB.prepare(`
      SELECT o.outlet_id
      FROM outlets o
      INNER JOIN outlet_users ou
        ON ou.outlet_id = o.outlet_id
      WHERE o.outlet_code = ?
        AND o.is_active = 1
        AND ou.user_id = ?
        AND ou.is_active = 1
      LIMIT 1
    `).bind(outletCode, user.user_id).first();

    if (!outlet) {
      return json({
        error: "Cashier not assigned to this active outlet"
      }, 403);
    }

    // Require the registered terminal to belong to the same active outlet.
    const device = await authenticateDevice(request, env);
    if (!device) return json({ error: "Registered terminal required" }, 401);
    const terminal = await env.DB.prepare(`
      SELECT 1 FROM outlet_terminals
      WHERE device_id = ? AND outlet_id = ? AND is_active = 1
      LIMIT 1
    `).bind(device.device_id, outlet.outlet_id).first();
    if (!terminal) return json({ error: "Terminal is not assigned to this outlet" }, 403);

    const shiftId = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO pos_shifts (
        shift_id,
        outlet_id,
        cashier_id,
        opening_cents,
        device_id
      )
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      shiftId,
      outlet.outlet_id,
      user.user_id,
      openingCents,
      device.device_id
    ).run();

    return json({
      success: true,
      shiftId,
      outletCode,
      openingCents,
      status: "open"
    }, 201);

  } catch (error) {
    const message = String(error?.message || "");

    if (message.includes("UNIQUE constraint")) {
      return json({
        error: "An open shift already exists for this cashier and outlet"
      }, 409);
    }

    return json({
      error: "Unable to open cashier shift"
    }, 503);
  }
}


 // ==========================================
 // CASHIER: CURRENT SHIFT
 // ==========================================

async function getCashierCurrentShift(request, env) {
  if (!env.DB) {
    return json({ error: "Database unavailable" }, 503);
  }

  try {
    const user = await authenticateUser(request, env);

    if (!user) {
      return json({ error: "Authentication required" }, 401);
    }

    if (user.role !== "cashier") {
      return json({ error: "Cashier access required" }, 403);
    }

    const device = await authenticateDevice(request, env);
    if (!device) return json({ error: "Registered terminal required" }, 401);

    const result = await env.DB.prepare(`
      SELECT
        s.shift_id,
        s.outlet_id,
        s.cashier_id,
        s.opening_cents,
        COALESCE((SELECT SUM(t.total_cents) FROM sales t WHERE t.shift_id=s.shift_id AND json_extract(t.payload_json,'$.paymentMethod')='cash'),0) AS cash_sales_cents,
        COALESCE((SELECT SUM(m.amount_cents) FROM pos_cash_movements m WHERE m.shift_id=s.shift_id AND m.type='cash_in'),0) AS cash_in_cents,
        COALESCE((SELECT SUM(m.amount_cents) FROM pos_cash_movements m WHERE m.shift_id=s.shift_id AND m.type='cash_out'),0) AS cash_out_cents,
        s.status,
        s.opened_at,
        s.device_id,
        o.outlet_code,
        o.outlet_name
      FROM pos_shifts s
      INNER JOIN outlets o
        ON o.outlet_id = s.outlet_id
      INNER JOIN outlet_users ou
        ON ou.outlet_id = s.outlet_id
        AND ou.user_id = s.cashier_id
      WHERE s.cashier_id = ?
        AND s.device_id = ?
        AND s.status = 'open'
        AND ou.is_active = 1
        AND o.is_active = 1
      ORDER BY s.opened_at DESC
      LIMIT 1
    `).bind(user.user_id, device.device_id).first();

    return json({
      success: true,
      shift: result || null
    });

  } catch {
    return json({
      error: "Unable to retrieve cashier shift"
    }, 503);
  }
}



async function cashierCashMovements(request, env) {
  const user = await authenticateUser(request, env);
  if (!user || user.role !== "cashier") return json({error:"Cashier login required"},403);
  const device = await authenticateDevice(request, env);
  if (!device) return json({error:"Registered terminal required"},401);
  const scope = `SELECT s.shift_id FROM pos_shifts s JOIN outlets o ON o.outlet_id=s.outlet_id JOIN outlet_users u ON u.outlet_id=s.outlet_id AND u.user_id=s.cashier_id JOIN outlet_terminals t ON t.outlet_id=s.outlet_id AND t.device_id=s.device_id WHERE s.cashier_id=? AND s.device_id=? AND s.status='open' AND o.is_active=1 AND u.is_active=1 AND t.is_active=1`;
  try {
    const shift=await env.DB.prepare(scope).bind(user.user_id,device.device_id).first();
    if (!shift) return json({error:"Open shift required"},409);
    if(request.method==='GET') return json({success:true,movements:(await env.DB.prepare('SELECT * FROM pos_cash_movements WHERE shift_id=? ORDER BY created_at DESC').bind(shift.shift_id).all()).results});
    if(request.method!=='POST') return json({error:"Method not allowed"},405);
    const b=await readJSON(request,4096);
    const categories={cash_out:["Gas expense","Ingredient purchases","Transport expense","Electricity / Water","Staff advance","Short-term loan issued","Loan repayment paid","Supplier payment","Maintenance","Owner withdrawal","Other expenses"],cash_in:["Loan repayment","Additional cash float","Loan received","Owner contribution","Other cash receipts"]};
    if(!b || !categories[b.type]?.includes(b.category) || !Number.isSafeInteger(b.amountCents) || b.amountCents<=0 || b.amountCents>1000000000 || typeof b.reason!=='string' || !b.reason.trim() || b.reason.trim().length>180 || typeof b.movementId!=='string' || !/^[a-f0-9-]{36}$/.test(b.movementId) || b.shiftId!==shift.shift_id) return json({error:"Invalid movement details"},400);
    const reason=b.category+": "+b.reason.trim();
    const r=await env.DB.prepare(`INSERT INTO pos_cash_movements(movement_id,shift_id,type,amount_cents,reason) SELECT ?,shift_id,?,?,? FROM (${scope}) WHERE shift_id=? ON CONFLICT(movement_id) DO NOTHING`).bind(b.movementId,b.type,b.amountCents,reason,user.user_id,device.device_id,b.shiftId).run();
    if(!r.meta.changes){const old=await env.DB.prepare('SELECT * FROM pos_cash_movements WHERE movement_id=? AND shift_id=?').bind(b.movementId,b.shiftId).first();if(!old || old.type!==b.type || old.amount_cents!==b.amountCents || old.reason!==reason)return json({error:"Movement not recorded; verify shift"},409);}
    return json({success:true,movementId:b.movementId});
  } catch {return json({error:"Unable to process movement; retry same entry"},503);}
}

async function correctCashierSettlement(request,env) {
  const user=await authenticateUser(request,env);
  if(!user||user.role!=="cashier")return json({error:"Cashier access required"},403);
  const device=await authenticateDevice(request,env);
  if(!device)return json({error:"Registered terminal required"},401);
  const scope=`FROM pos_settlements st JOIN pos_shifts s ON s.shift_id=st.shift_id JOIN outlets o ON o.outlet_id=s.outlet_id JOIN outlet_users ou ON ou.outlet_id=s.outlet_id AND ou.user_id=s.cashier_id JOIN outlet_terminals t ON t.outlet_id=s.outlet_id AND t.device_id=s.device_id WHERE s.cashier_id=? AND s.device_id=? AND s.status='closed' AND st.status='rejected' AND o.is_active=1 AND ou.is_active=1 AND t.is_active=1`;
  try {
    if(request.method==='GET')return json({success:true,settlements:(await env.DB.prepare(`SELECT st.settlement_id,st.rejection_reason,st.submitted_at,st.counted_cents,s.shift_id,s.opening_cents,o.outlet_code, COALESCE((SELECT SUM(total_cents) FROM sales WHERE shift_id=s.shift_id AND json_extract(payload_json,'$.paymentMethod')='cash'),0) cash_sales_cents, COALESCE((SELECT SUM(amount_cents) FROM pos_cash_movements WHERE shift_id=s.shift_id AND type='cash_in'),0) cash_in_cents, COALESCE((SELECT SUM(amount_cents) FROM pos_cash_movements WHERE shift_id=s.shift_id AND type='cash_out'),0) cash_out_cents ${scope} ORDER BY st.submitted_at DESC LIMIT 100`).bind(user.user_id,device.device_id).all()).results});
    if(request.method!=='POST')return json({error:"Method not allowed"},405);
    const b=await readJSON(request,4096), ds=b?.denominations;
    if(typeof b?.settlementId!=='string'||!Array.isArray(ds)||!ds.length||ds.length>11)return json({error:"Invalid correction"},400);
    const allowed=new Set([500000,100000,50000,20000,10000,5000,2000,1000,500,200,100]),seen=new Set();let total=0;
    for(const d of ds){if(!allowed.has(d?.valueCents)||seen.has(d.valueCents)||!Number.isSafeInteger(d.count)||d.count<0||d.count>100000)return json({error:"Invalid denomination"},400);seen.add(d.valueCents);total+=d.valueCents*d.count;}
    if(!Number.isSafeInteger(total)||total>1000000000)return json({error:"Invalid cash total"},400);
    const r=await env.DB.prepare(`UPDATE pos_settlements SET denominations_json=?,counted_cents=?,status='pending',submitted_at=CURRENT_TIMESTAMP,reviewed_at=NULL,reviewed_by=NULL,rejection_reason=NULL WHERE settlement_id IN (SELECT st.settlement_id ${scope} AND st.settlement_id=?)`).bind(JSON.stringify(ds),total,user.user_id,device.device_id,b.settlementId).run();
    return r.meta.changes===1?json({success:true}):json({error:"Rejected settlement not available; refresh status"},409);
  }catch{return json({error:"Unable to process settlement correction"},503);}
}

// CASHIER: CLOSE SHIFT AND SUBMIT DENOMINATIONS
async function closeCashierShift(request, env) {
  if (!env.DB) return json({error:"Database unavailable"},503);
  const user = await authenticateUser(request,env);
  if (!user) return json({error:"Authentication required"},401);
  if (user.role !== "cashier") return json({error:"Cashier access required"},403);
  const device = await authenticateDevice(request,env);
  if (!device) return json({error:"Registered terminal required"},401);
  let body;
  try {body=await readJSON(request,4096);} catch {return json({error:"Invalid JSON"},400);}
  const denominations=body?.denominations;
  if (!Array.isArray(denominations) || denominations.length<1 || denominations.length>30)
    return json({error:"Denomination breakdown required"},400);
  let total=0;
  const seen=new Set();
  for (const d of denominations) {
    if (!Number.isSafeInteger(d?.valueCents) || d.valueCents<=0 ||
        !Number.isSafeInteger(d?.count) || d.count<0 || d.count>100000 ||
        seen.has(d.valueCents)) return json({error:"Invalid or duplicate denomination"},400);
    seen.add(d.valueCents);
    total+=d.valueCents*d.count;
  }
  if (!Number.isSafeInteger(total) || total>1000000000)
    return json({error:"Invalid cash total"},400);
  try {
    const shift=await env.DB.prepare(`SELECT shift_id FROM pos_shifts
      WHERE shift_id=? AND cashier_id=? AND device_id=? AND status='open'`)
      .bind(body.shiftId,user.user_id,device.device_id).first();
    if (!shift) return json({error:"Open shift not found for this cashier and terminal"},409);
    const settlementId=crypto.randomUUID();
    // D1 batch is transactional: do not close without recording settlement.
    const results=await env.DB.batch([
      env.DB.prepare(`UPDATE pos_shifts SET status='closed',counted_cents=?,closed_at=CURRENT_TIMESTAMP
        WHERE shift_id=? AND cashier_id=? AND device_id=? AND status='open'`)
        .bind(total,body.shiftId,user.user_id,device.device_id),
      env.DB.prepare(`INSERT INTO pos_settlements
        (settlement_id,shift_id,denominations_json,counted_cents)
        SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM pos_shifts
          WHERE shift_id=? AND status='closed')`)
        .bind(settlementId,body.shiftId,JSON.stringify(denominations),total,body.shiftId)
    ]);
    if (results[0].meta.changes!==1 || results[1].meta.changes!==1)
      return json({error:"Shift could not be closed"},409);
    return json({success:true,shiftId:body.shiftId,settlementId,countedCents:total,status:"pending_approval"});
  } catch {return json({error:"Unable to close shift; check settlement status"},503);}
}

// ==========================================
// CLOUDFLARE WORKER ROUTES
// ==========================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Reject cross-origin state-changing authentication and admin requests.
    if (
    (url.pathname.startsWith("/api/auth/") ||
 url.pathname.startsWith("/api/admin/") ||
 url.pathname.startsWith("/api/cashier/")) &&
      ["POST", "PUT", "PATCH", "DELETE"].includes(request.method) &&
      request.headers.get("Origin") !== url.origin
    ) {
      return json({
        error: "Invalid request origin"
      }, 403);
    }

    // User login
    if (url.pathname === "/api/auth/login") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }
      return loginUser(request, env);
    }

    // User logout
    if (url.pathname === "/api/auth/logout") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }
      return logoutUser(request, env);
    }

    // Verify current user
    if (url.pathname === "/api/auth/me") {
      if (request.method !== "GET") {
        return json({ error: "Method not allowed" }, 405);
      }
      return currentUser(request, env);
    }


    if (url.pathname === "/api/cashier/catalogue") {
      if (request.method !== "GET") return json({error:"Method not allowed"},405);
      const user = await authenticateUser(request,env);
      const device = await authenticateDevice(request,env);
      if (!user || !device) return json({error:"Authentication required"},401);
      if (user.role !== "cashier") return json({error:"Cashier access required"},403);
      const scope = await env.DB.prepare(`SELECT DISTINCT o.outlet_id FROM outlet_terminals t JOIN outlets o ON o.outlet_id=t.outlet_id JOIN outlet_users u ON u.outlet_id=o.outlet_id WHERE t.device_id=? AND u.user_id=? AND t.is_active=1 AND o.is_active=1 AND u.is_active=1`).bind(device.device_id,user.user_id).all();
      if(scope.results.length!==1) return json({error:"Exactly one authorized outlet required"},403);
      const outletId=scope.results[0].outlet_id;
      const [categories,products]=await env.DB.batch([
        env.DB.prepare(`SELECT category_id,name FROM pos_categories ORDER BY created_at,category_id`),
        env.DB.prepare(`SELECT p.product_id,p.name,p.category_id,p.is_active,COALESCE(op.price_cents,p.price_cents) AS price_cents FROM pos_products p LEFT JOIN pos_outlet_prices op ON op.product_id=p.product_id AND op.outlet_id=? ORDER BY p.created_at,p.product_id`).bind(outletId)
      ]);
      return json({success:true,deviceId:device.device_id,outletId,categories:categories.results,products:products.results});
    }

    if (url.pathname === "/api/cashier/settlement-corrections") return correctCashierSettlement(request,env);
    if (url.pathname === "/api/cashier/cash-movements") return cashierCashMovements(request,env);
    // Cashier: retrieve current open shift
    if (url.pathname === "/api/cashier/shifts/current") {
      if (request.method !== "GET") {
        return json({ error: "Method not allowed" }, 405);
      }

      return getCashierCurrentShift(request, env);
    }


    // Cashier: open a new shift
    if (url.pathname === "/api/cashier/shifts/open") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }

      return openCashierShift(request, env);
    }

    if (url.pathname === "/api/cashier/shifts/close") {
      if (request.method !== "POST") return json({error:"Method not allowed"},405);
      return closeCashierShift(request,env);
    }

    // Administrator-only cashier creation
    if (url.pathname === "/api/admin/cashiers") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }
      return createCashier(request, env);
    }

    // Administrator-only cashier password reset
    if (url.pathname === "/api/admin/cashiers/reset-password") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }
      return resetCashierPassword(request, env);
    }

    // Administrator-only outlet sales reporting
    if (url.pathname === "/api/admin/sales-summary") {
      if (request.method !== "GET") {
        return json({ error: "Method not allowed" }, 405);
      }
      return getOutletSalesSummary(request, env);
    }

    // Administrator-only outlet management
    if (url.pathname === "/api/admin/outlets") {
      if (request.method === "GET") {
        return listAdminOutlets(request, env);
      }

      if (request.method === "POST") {
        return createAdminOutlet(request, env);
      }

      if (request.method === "PUT") {
        return updateAdminOutlet(request, env);
      }

      return json({ error: "Method not allowed" }, 405);
    }

    // Administrator-only outlet status management
    if (url.pathname === "/api/admin/outlets/status") {
      if (request.method === "PATCH") {
        return changeAdminOutletStatus(request, env);
      }

      return json({ error: "Method not allowed" }, 405);
    }

    // Additional administrator management APIs
    if (url.pathname.startsWith("/api/admin/operations/")) {
      const kind = url.pathname.slice(
        "/api/admin/operations/".length
      );

      if (![
        "terminals",
        "cashiers",
        "assignments",
        "categories",
        "products",
        "prices",
        "shifts",
        "cash-movements",
        "settlements",
        "reports",
        "reconciliation", "registration-code", "devices", "late-sales"
      ].includes(kind)) {
        return json({ error: "Not found" }, 404);
      }

      return adminOperations(request, env, kind);
    }

    // First Administrator setup
    if (url.pathname === "/api/auth/setup") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }
      return setupAdmin(request, env);
    }

    // Register cashier terminal
    if (url.pathname === "/api/register") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }
      return registerDevice(request, env);
    }

    // Synchronize sales
    if (url.pathname === "/api/sync") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }
      return syncSale(request, env);
    }

    // Unknown API endpoint
    if (url.pathname.startsWith("/api/")) {
      return json({
        error: "API endpoint not implemented"
      }, 404);
    }

    // Serve Premium POS application files
    return env.ASSETS.fetch(request);
  }
};
