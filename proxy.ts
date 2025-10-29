import { NextRequest, NextResponse } from "next/server";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for excluded paths
  if (
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Get session cookie (edge-safe: read directly from request cookies)
  // Better Auth cookie names
  const sessionCookie =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("better-auth.session_data")?.value;

  // If no session cookie exists, redirect to appropriate sign-in page
  if (!sessionCookie) {
    const redirectUrl = new URL("/auth/signin", request.url);
    redirectUrl.searchParams.set(
      "redirectTo",
      request.nextUrl.pathname + request.nextUrl.search
    );
    return NextResponse.redirect(redirectUrl);
  }
  // Session cookie exists, allow the request to proceed
  // Actual role validation will happen in the page/component
  return NextResponse.next();
}

/**
 * Configuration for the proxy
 * Specifies which paths should be processed by this proxy
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - / (landing page)
     * - /auth (authentication pages)
     * - /api (API routes)
     * - /_next/static (static files)
     * - /_next/image (image optimization files)
     * - /favicon.ico (favicon file)
     * - /public (public files)
     */
    "/((?!$|auth|api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
