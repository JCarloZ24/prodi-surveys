import { redirect } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { rowsToRespondents, buildEnumSlugMap } from "@/lib/submission-mapper";
import { PortalShell } from "@/components/portal/StaffPortal";
import { defaultView, isRole } from "@/lib/portal-views";
import { getAppSettings } from "@/lib/settings";
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
    const [{ data }, { data: enumProfiles }] = await Promise.all([
      db
        .from("submissions")
        .select("*")
        .neq("survey_type", "lead")
        .neq("status", "started")
        .order("created_at", { ascending: false }),
      db.from("profiles").select("slug, full_name").eq("role", "enumerator"),
    ]);
    const enumBySlug = buildEnumSlugMap(enumProfiles ?? []);
    respondents = rowsToRespondents(
      (data ?? []).map((row) => row as Record<string, unknown>),
      enumBySlug,
    );
    // Full payout numbers + account names are admin-only — strip them for other
    // roles so they never reach the client payload.
    if (profile.role !== "admin") {
      respondents = respondents.map((r) => ({
        ...r,
        acctNum: "",
        acctName: "",
        shipAddress: "",
        shipPhone: "",
        shipRecipient: "",
      }));
    }
  } catch {
    // DB unavailable — portal loads with an empty respondent list.
  }

  const settings = await getAppSettings();

  return (
    <PortalShell
      role={profile.role}
      initialRespondents={respondents}
      userName={profile.full_name ?? undefined}
      userSlug={profile.slug ?? null}
      initialSurveyPayout={settings.surveyPayout}
      initialRespondentToken={settings.respondentToken}
      initialTargets={settings.targets}
    >
      {children}
    </PortalShell>
  );
}
