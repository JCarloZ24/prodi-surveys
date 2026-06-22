"use client";

import { useEffect } from "react";
import { RespondentFlow } from "@/components/flow/RespondentFlow";
import { Toast } from "@/components/ui/Toast";
import { PortalProvider, usePortal, type SelfServiceLaunch } from "@/lib/store";

function EnumeratorFlow({
  slug,
  referralCode,
  selfService,
  rType,
  prefill,
}: {
  slug: string;
  referralCode?: string;
  selfService?: boolean;
  rType?: string;
  prefill?: SelfServiceLaunch;
}) {
  const { actions } = usePortal();

  useEffect(() => {
    if (selfService) {
      actions.launchEnumeratorSelfServiceFlow(slug, prefill ?? { referralCode, rType });
    } else {
      actions.launchEnumeratorFlow(slug, referralCode);
    }
  }, [actions, slug, referralCode, selfService, rType, prefill]);

  return <RespondentFlow />;
}

// Survey opened from an enumerator's link: /s/<enumerator-slug>
// (optionally ?referral-code=<code>). With ?self-service=true the respondent skips
// straight to the survey (Profile/Register/Verify are hidden); when the link also
// carries ?sid=<id>, `prefill` holds the respondent's identity/qualification/consent
// loaded from the enumerator's partial submission so the final submit updates that
// same row. The slug + referral code are recorded on submit.
export function SurveyPageClient({
  slug,
  referralCode,
  selfService,
  rType,
  prefill,
}: {
  slug: string;
  referralCode?: string;
  selfService?: boolean;
  rType?: string;
  prefill?: SelfServiceLaunch;
}) {
  return (
    <PortalProvider>
      <EnumeratorFlow
        slug={slug}
        referralCode={referralCode}
        selfService={selfService}
        rType={rType}
        prefill={prefill}
      />
      <Toast />
    </PortalProvider>
  );
}
