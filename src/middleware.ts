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

  // In development (localhost), allow direct access to /app routes
  const isLocalhost = hostname.startsWith("localhost") || hostname.startsWith("127.0.0.1");

  if (isLocalhost) {
    // Direct access to /app/* routes
    if (pathname.startsWith("/app")) {
      return NextResponse.next();
    }
    // Root on localhost shows the app (dashboard)
    const url = request.nextUrl.clone();
    url.pathname = `/app${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Production: app.klodchain.com -> serves /app routes
  const isAppDomain = hostname === "app.klodchain.com";

  if (isAppDomain) {
    // Don't double-prefix if already starts with /app
    if (pathname.startsWith("/app")) {
      return NextResponse.next();
    }
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
