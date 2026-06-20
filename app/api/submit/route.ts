import { NextRequest, NextResponse } from "next/server";
import { supabase as db } from "@/lib/supabase";

// POST /api/submit — persist a completed survey submission
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { registration, qualification, survey_type, answers, selfie_url, payout_details, referrer_code } = body;

  if (!registration || !qualification || !survey_type || !answers) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

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
