import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase-ssr";

// Portal paths reachable without an approved session. Full role/status gating
// happens in the server components (app/portal/page.tsx via requireApproved).
const PUBLIC_PORTAL_PATHS = [
  "/portal/login",
  "/portal/signup",
  "/portal/verify-email",
  "/portal/pending",
];

function isPublicPortal(pathname: string): boolean {
  return PUBLIC_PORTAL_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function proxy(request: NextRequest) {
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

  // Refresh the Supabase auth session (rotates cookies) and resolve the user.
  const { response, user } = await updateSession(request);

  // Early-exit auth gate: bounce unauthenticated requests away from protected
  // portal pages at the edge. Approval/verification gating is done server-side.
  const isPortalPath = pathname.startsWith("/portal");
  if (isPortalPath && !isPublicPortal(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
