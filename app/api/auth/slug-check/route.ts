import { NextRequest, NextResponse } from "next/server";
import { isValidSlug } from "@/lib/slug";
import { isSlugAvailable } from "@/lib/slug-server";

// GET /api/auth/slug-check?slug=foo — live availability check for the signup
// slug picker. Public (not under /portal, so the proxy never gates it).
export async function GET(req: NextRequest) {
  const slug = (req.nextUrl.searchParams.get("slug") ?? "").toLowerCase().trim();

  if (!slug) {
    return NextResponse.json({ valid: false, available: false });
  }
  if (!isValidSlug(slug)) {
    return NextResponse.json({ valid: false, available: false });
  }

  try {
    const available = await isSlugAvailable(slug);
    return NextResponse.json({ valid: true, available });
  } catch (e) {
    console.error("slug-check error:", e);
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}
