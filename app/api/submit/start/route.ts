import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

// POST /api/submit/start — create a submission row the moment a respondent leaves
// the Register step, with status="started". The final /api/submit call updates this
// same row (by id) to status="submitted" once the survey is finished, so each
// respondent has exactly one row (and abandoned-after-register responses are
// captured). Service-role: submissions are never exposed to anon.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { registration_data, profiles_data, survey_type, enumerator_slug, payout_offered, consent } = body;

  if (!registration_data || !profiles_data || !survey_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from("submissions")
    .insert({
      registration_data,
      profiles_data,
      survey_type,
      enumerator_slug: enumerator_slug || null,
      consent: consent || null,
      // Whether a token/incentive is offered (cash for SME/Agri-Tech, tumbler for TSI).
      payout_offered: payout_offered ?? true,
      status: "started",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Submission start insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
