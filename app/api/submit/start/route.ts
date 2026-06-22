import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

// POST /api/submit/start — create a submission row the moment a respondent passes
// the OTP verify step, with is_survey_completed=false. The final /api/submit call
// updates this same row (by id) to is_survey_completed=true once the survey is
// finished, so each respondent has exactly one row (and abandoned-after-verify
// responses are captured). Service-role: submissions are never exposed to anon.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { registration, qualification, survey_type, referrer_code, enumerator_slug, consent, payout_offered } = body;

  if (!registration || !qualification || !survey_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from("submissions")
    .insert({
      registration,
      qualification,
      survey_type,
      answers: {},
      referrer_code: referrer_code || null,
      enumerator_slug: enumerator_slug || null,
      consent: consent || null,
      payout_offered: typeof payout_offered === "boolean" ? payout_offered : null,
      status: "started",
      is_survey_completed: false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Submission start insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
