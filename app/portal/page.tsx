import { requireApproved } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { rowToRespondent } from "@/lib/submission-mapper";
import { PortalApp } from "@/components/portal/PortalApp";
import type { Respondent } from "@/lib/types";

export default async function PortalPage() {
  const profile = await requireApproved();

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
    // DB unavailable — portal loads with empty respondent list.
  }

  return (
    <PortalApp
      initialRole={profile.role}
      initialRespondents={respondents}
    />
  );
}
