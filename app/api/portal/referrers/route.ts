import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { validateReferrer, generateReferrerCode } from "@/lib/referrer";

// GET /api/portal/referrers — admin-only list of managed referrers.
export async function GET() {
  const me = await getProfile();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = createAdminClient();
  const { data, error } = await db
    .from("referrer")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ referrers: data ?? [] });
}

// POST /api/portal/referrers — create a referrer with a generated PS-XXXX code.
export async function POST(req: NextRequest) {
  const me = await getProfile();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const result = validateReferrer(body);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  const db = createAdminClient();
  const referral_code = await generateReferrerCode(result.value.full_name + result.value.email);

  const { data, error } = await db
    .from("referrer")
    .insert({ ...result.value, referral_code, created_by: me.id })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ referrer: data });
}
