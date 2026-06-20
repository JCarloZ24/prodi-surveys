"use client";

import { PortalProvider, usePortal } from "@/lib/store";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { PortalShell } from "@/components/portal/PortalShell";
import { RespondentFlow } from "@/components/flow/RespondentFlow";
import { Toast } from "@/components/ui/Toast";

function Screens() {
  const { state } = usePortal();
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-surface">
      {state.mode === "login" && <LoginScreen />}
      {state.mode === "portal" && <PortalShell />}
      {state.mode === "flow" && <RespondentFlow />}
      <Toast />
    </div>
  );
}

export default function Home() {
  return (
    <PortalProvider>
      <Screens />
    </PortalProvider>
  );
}
