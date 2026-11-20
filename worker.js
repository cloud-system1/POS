
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

async function registerDevice(request, env) {
  if (!env.DB) {
    return json({ error: "D1 database not configured" }, 503);
  }

  let body;

  try {
    const raw = await request.text();

    if (raw.length > 4096) {
      return json({ error: "Request too large" }, 413);
    }

    body = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
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

    // Atomically claim the code and create the device.
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/register") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }

      return registerDevice(request, env);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({
        error: "API endpoint not implemented"
      }, 404);
    }

    return env.ASSETS.fetch(request);
  }
};
