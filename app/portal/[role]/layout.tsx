import { redirect } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { rowsToRespondents } from "@/lib/submission-mapper";
import { PortalShell } from "@/components/portal/StaffPortal";
import { defaultView, isRole } from "@/lib/portal-views";
import type { Respondent } from "@/lib/types";

// Role-scoped portal shell. Gates on an approved profile, enforces that the URL
// role matches the signed-in user, and loads submissions once for the provider
// (state persists across view navigations because this layout stays mounted).
export default async function PortalRoleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const profile = await requireApproved();
  if (!isRole(role) || role !== profile.role) {
    redirect(`/portal/${profile.role}/${defaultView()}`);
  }

  let respondents: Respondent[] = [];
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("submissions")
      .select("*")
      .neq("survey_type", "lead")
      .eq("is_survey_completed", true)
      .order("created_at", { ascending: false });
    respondents = rowsToRespondents(
      (data ?? []).map((row) => row as Record<string, unknown>),
    );
  } catch {
    // DB unavailable — portal loads with an empty respondent list.
  }

  return (
    <PortalShell role={profile.role} initialRespondents={respondents}>
      {children}
    </PortalShell>
  );
}
