import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/lib/portal-auth";
import { createAdminClient } from "@/lib/supabase-server";
import { rowToRespondent } from "@/lib/submission-mapper";
import { PortalApp } from "@/components/portal/PortalApp";
import type { Respondent } from "@/lib/types";

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
    // DB unavailable — portal loads with empty respondent list.
  }

  return (
    <PortalApp
      initialRole={session.role}
      initialRespondents={respondents}
    />
  );
}
