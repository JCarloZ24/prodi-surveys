import { NextRequest, NextResponse } from "next/server";
import { code, hash } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase-server";
import { REG_Q } from "@/lib/registration";

// POST /api/submit — persist a completed survey submission.
// Uses the service-role client: submissions hold sensitive payout details, so
// they are written server-side and never exposed to the anon role (which has no
// SELECT policy on this table).
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, registration_data, profiles_data, survey_type, selfie_url, token_data, kobo_start, kobo_end, referrer_code, enumerator_slug, consent } = body;

  if (!registration_data || !profiles_data || !survey_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = createAdminClient();
  const generatedReferralCode =
    "PS-" + code(hash((registration_data[REG_Q.email] || registration_data[REG_Q.name] || "respondent") + Date.now()));
  // The respondent's own referral code is system metadata (queried by JSONB path in
  // referral validation), so it keeps its snake_case key alongside the labeled fields.
  const savedRegistration = {
    ...registration_data,
    generated_referral_code: generatedReferralCode,
  };

  // token_data is the single generic token column: a cash-payout shape for
  // SME/Agri-Tech, a tumbler-shipping shape for TSI (only one is ever populated).
  const payload: Record<string, unknown> = {
    registration_data: savedRegistration,
    profiles_data,
    survey_type,
    selfie_url: selfie_url || null,
    token_data: token_data || null,
    kobo_start: kobo_start || null,
    kobo_end: kobo_end || null,
    referrer_code: referrer_code || null,
    enumerator_slug: enumerator_slug || null,
    consent: consent || null,
    status: "submitted",
    updated_at: new Date().toISOString(),
  };

  // When an id is supplied, the row was already created at the Register step — flip
  // it to submitted in place so there's one row per respondent. Otherwise (e.g.
  // a survey-only link that skips it) insert a fresh submitted row.
  const query = id
    ? db.from("submissions").update(payload).eq("id", id).select("id").single()
    : db.from("submissions").insert(payload).select("id").single();

  const { data, error } = await query;

  if (error) {
    console.error("Submission save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data?.id, referral_code: generatedReferralCode });
}
