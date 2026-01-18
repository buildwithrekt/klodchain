import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Skip static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicons") ||
    pathname.startsWith("/assets") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // In development (localhost), allow direct access to /landing and /app routes
  const isLocalhost = hostname.startsWith("localhost") || hostname.startsWith("127.0.0.1");

  // Landing-specific routes (served from /landing/*)
  const landingRoutes = ["/roadmap", "/privacy", "/terms"];

  if (isLocalhost) {
    // Direct access to /landing/* routes
    if (pathname.startsWith("/landing")) {
      return NextResponse.next();
    }
    // Direct access to /app/* routes
    if (pathname.startsWith("/app")) {
      return NextResponse.next();
    }
    // Landing routes on localhost -> rewrite to /landing/*
    if (landingRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
      const url = request.nextUrl.clone();
      url.pathname = `/landing${pathname}`;
      return NextResponse.rewrite(url);
    }
    // Root on localhost shows the app (dashboard)
    const url = request.nextUrl.clone();
    url.pathname = `/app${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Production routing based on hostname
  const isLandingDomain =
    hostname === "klodchain.com" ||
    hostname === "www.klodchain.com";

  const isAppDomain = hostname === "app.klodchain.com";

  // Landing domain: klodchain.com -> serves /landing routes
  if (isLandingDomain) {
    const url = request.nextUrl.clone();
    url.pathname = `/landing${pathname}`;
    return NextResponse.rewrite(url);
  }

  // App domain: app.klodchain.com -> serves /app routes
  if (isAppDomain) {
    const url = request.nextUrl.clone();
    url.pathname = `/app${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (assets, favicons, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|assets|favicons).*)",
  ],
};
