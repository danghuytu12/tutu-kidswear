import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Protect all pages. The matcher below already excludes /api, /_next, and
// static assets, so only real page navigations reach here.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? "";
  const authed = token ? await verifySessionToken(token) : false;

  if (pathname === "/login") {
    // Already authed → send them to the dashboard.
    if (authed) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!authed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Everything except API routes, Next internals, and static assets.
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|icon.png).*)"],
};
