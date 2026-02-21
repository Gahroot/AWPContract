import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple proxy without importing auth (avoids crypto/node module issues in edge)
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes that don't require auth
  const publicRoutes = [
    "/login",
    "/api/auth",
    "/contracts/view",
    "/contracts/sign",
    "/api/contracts/public",
    "/invite",
    "/api/invites/accept",
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for session token cookie
  const token =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png|pdfs).*)"],
};
