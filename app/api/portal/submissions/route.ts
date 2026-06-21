import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/portal-auth";
import { createAdminClient } from "@/lib/supabase-server";
import type { Respondent } from "@/lib/types";

// Map a raw Supabase submissions row → Respondent shape the portal expects.
function rowToRespondent(row: Record<string, unknown>, idx: number): Respondent {
  const reg = (row.registration as Record<string, string>) ?? {};
  const pay = (row.payout_details as Record<string, string> | null) ?? null;
  const status = (row.status as string) ?? "submitted";

  const statusMap: Record<string, string> = {
    submitted: "Pending QA",
    verified: "Verified",
    rejected: "Rejected",
    follow_up: "Needs Follow-up",
  };

  return {
    id: idx + 1,
    name: reg.name ?? "—",
    org: reg.org ?? "—",
    type: (row.survey_type as Respondent["type"]) ?? "SME",
    status: statusMap[status] ?? status,
    region: reg.region ?? "—",
    position: reg.position ?? "—",
    email: reg.email ?? "",
    mobile: reg.mobile ?? "",
    emailV: true,
    surveyDone: true,
    selfie: Boolean(row.selfie_url),
    verified: status === "verified",
    token: 0,
    bonus: 0,
    referred: Boolean(row.referrer_code),
    referrer: (row.referrer_code as string | null) ?? null,
    mode: "Self-service",
    enumerator: "—",
    payStatus: status === "verified" ? "Pending" : "—",
    method: pay?.method ?? "—",
    acct: pay?.acctNum ?? "—",
    compMin: 0,
    flags: [],
    code: reg.generated_referral_code ?? "",
    createdDays: 0,
    color: "#E0195F",
    payoutOn: Boolean(pay),
    // Keep raw UUID so portal can PATCH by id
    _supabaseId: row.id as string,
  } as Respondent & { _supabaseId: string };
}

export async function GET(req: NextRequest) {
  const session = verifySession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const respondents = (data ?? []).map((row, i) =>
    rowToRespondent(row as Record<string, unknown>, i)
  );

  return NextResponse.json({ respondents });
}
