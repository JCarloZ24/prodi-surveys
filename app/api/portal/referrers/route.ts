import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { validateReferrer, generateReferrerCode } from "@/lib/referrer";

// GET /api/portal/referrers — list of managed referrers (admin only).
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

  const referrers = data ?? [];

  // One pass over completed submissions powers two derived facts:
  //  • stats — count submissions that entered each referrer's code (referrer_code)
  //  • slug  — for a respondent referrer, the enumerator they were enrolled under
  //            (their own submission's generated_referral_code → enumerator_slug),
  //            so their shareable link can route through that enumerator.
  const tally = new Map<string, { total: number; verified: number }>();
  const slugByCode = new Map<string, string>();
  const { data: subs } = await db
    .from("submissions")
    .select("referrer_code, status, enumerator_slug, registration")
    .eq("is_survey_completed", true);
  for (const s of subs ?? []) {
    const usedCode = s.referrer_code as string | null;
    if (usedCode) {
      const t = tally.get(usedCode) ?? { total: 0, verified: 0 };
      t.total += 1;
      if (s.status === "verified") t.verified += 1;
      tally.set(usedCode, t);
    }
    const reg = s.registration as { generated_referral_code?: string } | null;
    const genCode = reg?.generated_referral_code;
    if (genCode && s.enumerator_slug) slugByCode.set(genCode, s.enumerator_slug as string);
  }

  // Enumerator referrers route through their OWN enumerator page (/s/<slug>):
  // match the referrer to an enumerator profile by email, then by name (so a
  // minor email typo doesn't break the link).
  const slugByEmail = new Map<string, string>();
  const slugByName = new Map<string, string>();
  const norm = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();
  const { data: enumProfiles } = await db
    .from("profiles")
    .select("email, full_name, slug")
    .eq("role", "enumerator");
  for (const p of enumProfiles ?? []) {
    if (!p.slug) continue;
    if (p.email) slugByEmail.set(norm(p.email as string), p.slug as string);
    if (p.full_name) slugByName.set(norm(p.full_name as string), p.slug as string);
  }

  const enriched = referrers.map((r) => {
    const t = tally.get(r.referral_code) ?? { total: 0, verified: 0 };
    // Prefer the enrolling-enumerator slug (respondent referrers); otherwise the
    // referrer's own enumerator slug matched by email then name (enumerator referrers).
    const enumerator_slug =
      slugByCode.get(r.referral_code) ??
      slugByEmail.get(norm(r.email)) ??
      slugByName.get(norm(r.full_name)) ??
      null;
    return {
      ...r,
      enumerator_slug,
      total_referrals: t.total,
      verified_referrals: t.verified,
      conversion_rate: t.total ? t.verified / t.total : 0,
    };
  });

  return NextResponse.json({ referrers: enriched });
}

// POST /api/portal/referrers — create a referrer with a generated PS-XXXX code (admin only).
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
