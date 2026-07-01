import { createAdminClient } from "@/lib/supabase-server";
import { ResumePageClient } from "../../ResumePageClient";
import { InvalidSurveyLink } from "../../InvalidSurveyLink";
import { AlreadySubmittedLink } from "../../AlreadySubmittedLink";

// /s/<enumerator-slug>/<access-code> — a self-service survey link.
// The enumerator pre-filled Profile + Register and generated this code; the
// respondent opens it to finish the survey themselves. PUBLIC (no sign-in): the
// unguessable access code is the credential. (The bare /s/<slug> link, by contrast,
// requires an authenticated enumerator — see ../page.tsx.)
export default async function ResumeSurveyPage({
  params,
}: {
  params: Promise<{ code: string; respondent: string }>;
}) {
  const { code: slug, respondent } = await params;
  const accessCode = decodeURIComponent(respondent).trim();

  const db = createAdminClient();
  const { data: row } = await db
    .from("submissions")
    .select("id, access_code, status, resume_state, enumerator_slug, survey_type, consent")
    .eq("access_code", accessCode)
    .maybeSingle();

  // Unknown code, or the code belongs to a different enumerator's link.
  if (!row || row.enumerator_slug !== decodeURIComponent(slug).trim().toLowerCase()) {
    return <InvalidSurveyLink />;
  }

  // The survey was already completed from this link — don't let it re-enter.
  if (row.status === "submitted") {
    return <AlreadySubmittedLink />;
  }

  const resume = (row.resume_state ?? {}) as {
    reg?: Record<string, unknown>;
    qual?: Record<string, unknown>;
    rType?: string;
  };

  return (
    <ResumePageClient
      draft={{
        submissionId: row.id,
        accessCode,
        // resume_state carries the raw store shapes; fall back to survey_type for rType.
        reg: resume.reg ?? {},
        qual: resume.qual ?? {},
        rType: (resume.rType ?? row.survey_type) as "TSI" | "AgriTech" | "SME",
        enumeratorSlug: row.enumerator_slug ?? "",
        consent: (row.consent ?? null) as {
          terms?: boolean;
          privacy?: boolean;
          accepted_at?: string | null;
        } | null,
        // Straight to the Survey step (consent already captured by the enumerator).
        startStep: 5,
      }}
    />
  );
}
