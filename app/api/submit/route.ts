import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

// POST /api/submit — persist a completed survey submission.
// Uses the service-role client: submissions hold sensitive payout details, so
// they are written server-side and never exposed to the anon role (which has no
// SELECT policy on this table).
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { registration, qualification, survey_type, answers, selfie_url, payout_details, referrer_code, consent } = body;

  if (!registration || !qualification || !survey_type || !answers) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from("submissions")
    .insert({
      registration,
      qualification,
      survey_type,
      answers,
      selfie_url: selfie_url || null,
      payout_details: payout_details || null,
      referrer_code: referrer_code || null,
      consent: consent || null,
      status: "submitted",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Submission insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
