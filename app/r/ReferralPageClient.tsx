"use client";

import { useEffect } from "react";
import { RespondentFlow } from "@/components/flow/RespondentFlow";
import { Toast } from "@/components/ui/Toast";
import { PortalProvider, usePortal } from "@/lib/store";

function ReferralFlow({ code, preview = false }: { code: string; preview?: boolean }) {
  const { actions } = usePortal();
  const referralCode = code.trim().toUpperCase();

  useEffect(() => {
    if (referralCode) actions.launchReferralFlow(referralCode, preview);
  }, [actions, preview, referralCode]);

  return <RespondentFlow />;
}

export function ReferralPageClient({ code, preview = false }: { code: string; preview?: boolean }) {
  return (
    <PortalProvider>
      <ReferralFlow code={code} preview={preview} />
      <Toast />
    </PortalProvider>
  );
}
