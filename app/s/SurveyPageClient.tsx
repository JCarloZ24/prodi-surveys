"use client";

import { useEffect } from "react";
import { RespondentFlow } from "@/components/flow/RespondentFlow";
import { Toast } from "@/components/ui/Toast";
import { PortalProvider, usePortal } from "@/lib/store";

function EnumeratorFlow({
  slug,
  referralCode,
}: {
  slug: string;
  referralCode?: string;
}) {
  const { actions } = usePortal();

  useEffect(() => {
    actions.launchEnumeratorFlow(slug, referralCode);
  }, [actions, slug, referralCode]);

  return <RespondentFlow />;
}

// Full respondent flow opened from an enumerator's link: /s/<enumerator-slug>
// (optionally ?referral-code=<code>). The slug + referral code are recorded on
// submit.
export function SurveyPageClient({
  slug,
  referralCode,
}: {
  slug: string;
  referralCode?: string;
}) {
  return (
    <PortalProvider>
      <EnumeratorFlow slug={slug} referralCode={referralCode} />
      <Toast />
    </PortalProvider>
  );
}
