import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Require a valid admin session on an API route.
 *
 * The middleware matcher excludes /api entirely, so route handlers get no
 * protection from it — a state-changing endpoint has to ask for itself. Mirrors
 * assertCronAuthorized in app/api/cron/shared.ts: returns a 401 response to
 * short-circuit on denial, or null to proceed.
 */
export async function requireSession(request: Request): Promise<NextResponse | null> {
  const cookie = request.headers.get("cookie") ?? "";
  const match = new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]*)`).exec(cookie);
  const token = match ? decodeURIComponent(match[1]) : "";
  if (token && (await verifySessionToken(token))) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
