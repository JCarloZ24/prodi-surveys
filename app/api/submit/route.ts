import { NextRequest, NextResponse } from "next/server";
import { code, hash } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase-server";

// POST /api/submit — persist a completed survey submission.
// Uses the service-role client: submissions hold sensitive payout details, so
// they are written server-side and never exposed to the anon role (which has no
// SELECT policy on this table).
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, registration, qualification, survey_type, answers, selfie_url, payout_details, shipping_details, referrer_code, enumerator_slug, consent } = body;

  if (!registration || !qualification || !survey_type || !answers) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = createAdminClient();
  const generatedReferralCode =
    "PS-" + code(hash((registration.email || registration.name || "respondent") + Date.now()));
  const savedRegistration = {
    ...registration,
    // registration.type must always match the survey path it was submitted under.
    type: survey_type,
    generated_referral_code: generatedReferralCode,
  };

  // Only include shipping_details when it's actually provided (the column may
  // not exist yet if migration 003 hasn't been applied; omitting null values
  // keeps the insert backward-compatible with the pre-migration schema).
  const payload: Record<string, unknown> = {
    registration: savedRegistration,
    qualification,
    survey_type,
    answers,
    selfie_url: selfie_url || null,
    payout_details: payout_details || null,
    referrer_code: referrer_code || null,
    enumerator_slug: enumerator_slug || null,
    consent: consent || null,
    status: "submitted",
    is_survey_completed: true,
  };
  if (shipping_details) payload.shipping_details = shipping_details;

  // When an id is supplied, the row was already created at the verify step — flip
  // it to completed in place so there's one row per respondent. Otherwise (e.g.
  // a survey-only link that skips verify) insert a fresh completed row.
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
