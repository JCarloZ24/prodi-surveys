import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/lib/portal-auth";
import { createAdminClient } from "@/lib/supabase-server";
import { PortalApp } from "@/components/portal/PortalApp";
import type { Respondent } from "@/lib/types";

function rowToRespondent(row: Record<string, unknown>, idx: number): Respondent {
  const reg = (row.registration as Record<string, string>) ?? {};
  const pay = (row.payout_details as Record<string, string> | null) ?? null;
  const ship = (row.shipping_details as Record<string, string> | null) ?? null;
  const status = (row.status as string) ?? "submitted";

  const statusMap: Record<string, string> = {
    submitted: "Pending QA",
    verified: "Verified",
    rejected: "Rejected",
    follow_up: "Needs Follow-up",
  };

  const methodLabel = pay?.method ?? (ship ? "Tumbler / Shipping" : "—");

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
    method: methodLabel,
    acct: pay?.acctNum ?? "—",
    compMin: 0,
    flags: [],
    code: reg.generated_referral_code ?? "",
    createdDays: 0,
    color: "#E0195F",
    payoutOn: Boolean(pay),
  };
}

export default async function PortalPage() {
  const cookieStore = await cookies();
  const session = getSession(cookieStore);
  if (!session) redirect("/portal/login");

  // Fetch real submissions from Supabase using the service-role client.
  // Falls back to empty array if the DB is unreachable or has no submissions yet.
  let respondents: Respondent[] = [];
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });
    respondents = (data ?? []).map((row, i) =>
      rowToRespondent(row as Record<string, unknown>, i)
    );
  } catch {
    // DB unavailable — portal still loads with mock data from the store.
  }

  return (
    <PortalApp
      initialRole={session.role}
      initialRespondents={respondents}
    />
  );
}
