import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "prodi_portal_session";

// Proxy runs in Edge Runtime (no Node.js crypto).
// We do a lightweight format check here; the server component (app/portal/page.tsx)
// performs the full HMAC-SHA256 verification and redirects if the token is invalid.
function hasCookiePresent(req: NextRequest): boolean {
  const value = req.cookies.get(SESSION_COOKIE)?.value ?? "";
  // Signed format: <base64url-payload>.<base64url-sig> — both parts non-empty.
  const dot = value.lastIndexOf(".");
  return dot > 0 && dot < value.length - 1;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  // Subdomain rewrite: portal.* → /portal/<path>
  const isPortalSubdomain =
    host.startsWith("portal.") && !host.startsWith("portal.localhost");

  if (isPortalSubdomain) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal" + (pathname === "/" ? "" : pathname);
    return NextResponse.rewrite(url);
  }

  // Early-exit auth gate: reject obviously unauthenticated requests at the edge.
  // Full cryptographic verification happens in the server component.
  const isPortalPath = pathname.startsWith("/portal");
  const isLoginPath = pathname === "/portal/login";
  const isAuthApi = pathname.startsWith("/api/portal/auth");

  if (isPortalPath && !isLoginPath && !isAuthApi) {
    if (!hasCookiePresent(request)) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
