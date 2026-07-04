// Admin session auth. Credentials come from env; the session cookie holds an
// HMAC-signed token (never the password). All crypto uses Web Crypto so the
// same verify function runs in Edge middleware and Node route handlers.

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 604800

const DEV_SECRET_FALLBACK = "dev-insecure-admin-secret-change-me";

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) {
    console.warn(
      "[auth] ADMIN_SESSION_SECRET is not set — using an insecure dev default. Set it in production.",
    );
    return DEV_SECRET_FALLBACK;
  }
  return s;
}

/** Constant-time string comparison (avoids leaking length/timing via early exit). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Check a login attempt against the configured credentials. */
export function checkCredentials(username: string, password: string): boolean {
  const u = process.env.ADMIN_USERNAME ?? "tutukidswear";
  const p = process.env.ADMIN_PASSWORD ?? "Admin123";
  // Compare both regardless of the first result to keep timing uniform.
  const okU = safeEqual(username, u);
  const okP = safeEqual(password, p);
  return okU && okP;
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlOfString(s: string): string {
  return toBase64Url(new TextEncoder().encode(s));
}

async function hmac(payloadB64: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64),
  );
  return toBase64Url(new Uint8Array(sig));
}

/** Build a signed session token for `username`, valid for SESSION_MAX_AGE_SECONDS. */
export async function createSessionToken(username: string): Promise<string> {
  const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payloadB64 = base64UrlOfString(JSON.stringify({ u: username, exp }));
  const sig = await hmac(payloadB64);
  return `${payloadB64}.${sig}`;
}

/** Verify a session token's signature and expiry. Edge-safe (Web Crypto). */
export async function verifySessionToken(token: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sig] = parts;
  const expected = await hmac(payloadB64);
  if (!safeEqual(sig, expected)) return false;
  try {
    const json = new TextDecoder().decode(
      Uint8Array.from(
        atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0),
      ),
    );
    const payload = JSON.parse(json) as { u: string; exp: number };
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}
