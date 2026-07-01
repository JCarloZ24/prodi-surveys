import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-server";
import { getProfile } from "@/lib/auth";
import { SurveyPageClient } from "../SurveyPageClient";
import { InvalidSurveyLink } from "../InvalidSurveyLink";

// /s/<enumerator-slug> — the enumerator-facing survey link. The path segment is an
// approved enumerator's slug. This link is STAFF-ONLY: it may be opened only by a
// signed-in, approved admin or enumerator (respondents never use it directly).
// Respondents complete surveys via the public self-service link /s/<slug>/<code>
// (see ./[respondent]/page.tsx), which is exempt from this gate.
export default async function SurveyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // Require a signed-in, approved staff account (admin or enumerator).
  const profile = await getProfile();
  if (!profile) redirect("/portal/login");
  if (profile.status !== "approved" || (profile.role !== "admin" && profile.role !== "enumerator")) {
    redirect("/portal");
  }

  const slug = decodeURIComponent(code).trim().toLowerCase();

  // The survey must be opened from a valid, approved enumerator's link.
  const db = createAdminClient();
  const { data: enumerator } = await db
    .from("profiles")
    .select("slug")
    .eq("slug", slug)
    .eq("role", "enumerator")
    .eq("status", "approved")
    .maybeSingle();

  if (!enumerator) {
    return <InvalidSurveyLink />;
  }

  return <SurveyPageClient slug={enumerator.slug ?? slug} />;
}
