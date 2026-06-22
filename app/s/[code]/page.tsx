import { createAdminClient } from "@/lib/supabase-server";
import { SurveyPageClient } from "../SurveyPageClient";
import { InvalidSurveyLink } from "../InvalidSurveyLink";

// /s/<enumerator-slug>?referral-code=<code> — the canonical survey link.
// The path segment is an approved enumerator's slug; the referral code is optional.
export default async function SurveyPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { code } = await params;
  const sp = await searchParams;

  const slug = decodeURIComponent(code).trim().toLowerCase();
  const refParam = sp["referral-code"];
  const referralCode = typeof refParam === "string" ? refParam : undefined;
  // ?self-service=true drops the respondent straight into the survey (skipping
  // Profile/Register/Verify); ?t= carries the survey type the Profile step would
  // otherwise determine.
  const selfService = sp["self-service"] === "true";
  const rType = typeof sp["t"] === "string" ? (sp["t"] as string) : undefined;

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

  return (
    <SurveyPageClient
      slug={enumerator.slug ?? slug}
      referralCode={referralCode}
      selfService={selfService}
      rType={rType}
    />
  );
}
