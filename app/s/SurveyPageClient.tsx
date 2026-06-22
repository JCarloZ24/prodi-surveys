"use client";

import { useEffect } from "react";
import { RespondentFlow } from "@/components/flow/RespondentFlow";
import { Toast } from "@/components/ui/Toast";
import { PortalProvider, usePortal } from "@/lib/store";

function EnumeratorFlow({
  slug,
  referralCode,
  selfService,
  rType,
}: {
  slug: string;
  referralCode?: string;
  selfService?: boolean;
  rType?: string;
}) {
  const { actions } = usePortal();

  useEffect(() => {
    if (selfService) actions.launchEnumeratorSelfServiceFlow(slug, referralCode, rType);
    else actions.launchEnumeratorFlow(slug, referralCode);
  }, [actions, slug, referralCode, selfService, rType]);

  return <RespondentFlow />;
}

// Survey opened from an enumerator's link: /s/<enumerator-slug>
// (optionally ?referral-code=<code>). With ?self-service=true the respondent skips
// straight to the survey (Profile/Register/Verify are hidden) but the submission
// is still attributed to the enumerator slug + referral code. The slug + referral
// code are recorded on submit.
export function SurveyPageClient({
  slug,
  referralCode,
  selfService,
  rType,
}: {
  slug: string;
  referralCode?: string;
  selfService?: boolean;
  rType?: string;
}) {
  return (
    <PortalProvider>
      <EnumeratorFlow slug={slug} referralCode={referralCode} selfService={selfService} rType={rType} />
      <Toast />
    </PortalProvider>
  );
}
