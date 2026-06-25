import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { ORG_TYPE_LABELS, PROFILE_Q } from "@/lib/profile";
import type { Qual } from "@/lib/types";

// POST /api/leads — persist an "Other" or otherwise unqualified respondent profile.
// Writes to submissions (centralized) with status="lead". The captured org info and
// exit_reason live in profiles_data (labeled question keys, matching completed rows).
// registration_data is an empty object since the respondent exited before Register.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { org_type, org_name, exit_reason } = body;

  if (!org_type) {
    return NextResponse.json({ error: "org_type is required" }, { status: 400 });
  }

  const orgTitle = ORG_TYPE_LABELS[org_type as Qual["orgType"]] ?? org_type;

  const db = createAdminClient();
  const { error } = await db.from("submissions").insert({
    registration_data: {},
    profiles_data: {
      [PROFILE_Q.orgType]: orgTitle,
      [PROFILE_Q.orgName]: org_name || "",
      exit_reason: exit_reason || null,
    },
    survey_type: "lead",
    status: "lead",
  });

  if (error) {
    console.error("Lead submission insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
