import { createAdminClient } from "@/lib/supabase-server";
import { SurveyPageClient } from "../SurveyPageClient";
import { InvalidSurveyLink } from "../InvalidSurveyLink";
import { AlreadySubmitted } from "../AlreadySubmitted";
import type { SelfServiceLaunch } from "@/lib/store";

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

  // Self-service links carry ?sid=<partial submission id> created when the
  // enumerator verified the respondent's email. Load that row (only if it belongs
  // to this enumerator and isn't already completed) and prefill the respondent's
  // identity/qualification/consent so the final submit UPDATES it instead of
  // creating a duplicate, identity-less row.
  let prefill: SelfServiceLaunch | undefined;
  if (selfService) {
    const sid = typeof sp["sid"] === "string" ? (sp["sid"] as string) : undefined;
    if (sid) {
      const { data: row } = await db
        .from("submissions")
        .select("registration, qualification, consent, survey_type, referrer_code, enumerator_slug, payout_offered, is_survey_completed")
        .eq("id", sid)
        .maybeSingle();
      if (row && row.enumerator_slug === (enumerator.slug ?? slug)) {
        // Already finished — show a friendly confirmation instead of re-running it.
        if (row.is_survey_completed) {
          return <AlreadySubmitted />;
        }
        prefill = {
          submissionId: sid,
          reg: (row.registration as SelfServiceLaunch["reg"]) ?? undefined,
          qual: (row.qualification as SelfServiceLaunch["qual"]) ?? undefined,
          consent: (row.consent as SelfServiceLaunch["consent"]) ?? undefined,
          payoutOn: typeof row.payout_offered === "boolean" ? row.payout_offered : undefined,
          rType: row.survey_type ?? rType,
          referralCode: row.referrer_code ?? referralCode,
        };
      }
    }
    // A self-service link is only valid when its sid resolves to this enumerator's
    // not-yet-completed partial submission. Otherwise (no sid, unknown sid, or wrong
    // enumerator) decline — no identity-less fallback.
    if (!prefill) {
      return <InvalidSurveyLink />;
    }
  }

  return (
    <SurveyPageClient
      slug={enumerator.slug ?? slug}
      referralCode={referralCode}
      selfService={selfService}
      rType={rType}
      prefill={prefill}
    />
  );
}
