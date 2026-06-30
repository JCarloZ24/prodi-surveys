"use client";

import { useEffect } from "react";
import { RespondentFlow } from "@/components/flow/RespondentFlow";
import { Toast } from "@/components/ui/Toast";
import { PortalProvider, usePortal } from "@/lib/store";

function EnumeratorFlow({ slug }: { slug: string }) {
  const { actions } = usePortal();

  useEffect(() => {
    actions.launchEnumeratorFlow(slug);
  }, [actions, slug]);

  return <RespondentFlow />;
}

// Survey opened from an enumerator's link: /s/<enumerator-slug>.
// The slug is recorded on submit.
export function SurveyPageClient({ slug }: { slug: string }) {
  return (
    <PortalProvider>
      <EnumeratorFlow slug={slug} />
      <Toast />
    </PortalProvider>
  );
}
