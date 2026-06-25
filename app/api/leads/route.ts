import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

// POST /api/leads — persist an "Other" or otherwise unqualified respondent profile.
// Writes to submissions (centralized) with status="lead". The captured org info and
// exit_reason live in profiles_data. registration_data is an empty object since the
// respondent exited before the Register step.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { org_type, org_name, exit_reason } = body;

  if (!org_type) {
    return NextResponse.json({ error: "org_type is required" }, { status: 400 });
  }

  const db = createAdminClient();
  const { error } = await db.from("submissions").insert({
    registration_data: {},
    profiles_data: { orgType: org_type, orgName: org_name || null, exit_reason: exit_reason || null },
    survey_type: "lead",
    status: "lead",
  });

  if (error) {
    console.error("Lead submission insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
