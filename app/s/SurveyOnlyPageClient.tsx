"use client";

import { useEffect } from "react";
import { RespondentFlow } from "@/components/flow/RespondentFlow";
import { Toast } from "@/components/ui/Toast";
import { PortalProvider, usePortal } from "@/lib/store";

function SurveyOnlyFlow({ code, rType, preview = false }: { code: string; rType?: string; preview?: boolean }) {
  const { actions } = usePortal();
  const surveyCode = code.trim().toUpperCase();

  useEffect(() => {
    if (surveyCode) actions.launchSurveyOnlyFlow(surveyCode, preview, rType);
  }, [actions, preview, surveyCode, rType]);

  return <RespondentFlow />;
}

export function SurveyOnlyPageClient({ code, rType, preview = false }: { code: string; rType?: string; preview?: boolean }) {
  return (
    <PortalProvider>
      <SurveyOnlyFlow code={code} rType={rType} preview={preview} />
      <Toast />
    </PortalProvider>
  );
}
