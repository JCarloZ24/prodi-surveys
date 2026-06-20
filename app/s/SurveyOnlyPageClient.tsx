"use client";

import { useEffect } from "react";
import { RespondentFlow } from "@/components/flow/RespondentFlow";
import { Toast } from "@/components/ui/Toast";
import { PortalProvider, usePortal } from "@/lib/store";

function SurveyOnlyFlow({ code, preview = false }: { code: string; preview?: boolean }) {
  const { actions } = usePortal();
  const surveyCode = code.trim().toUpperCase();

  useEffect(() => {
    if (surveyCode) actions.launchSurveyOnlyFlow(surveyCode, preview);
  }, [actions, preview, surveyCode]);

  return <RespondentFlow />;
}

export function SurveyOnlyPageClient({ code, preview = false }: { code: string; preview?: boolean }) {
  return (
    <PortalProvider>
      <SurveyOnlyFlow code={code} preview={preview} />
      <Toast />
    </PortalProvider>
  );
}
