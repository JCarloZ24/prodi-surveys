"use client";

import { PortalProvider, usePortal } from "@/lib/store";
import { RespondentFlow } from "@/components/flow/RespondentFlow";
import { LandingGate } from "@/components/flow/LandingGate";
import { Toast } from "@/components/ui/Toast";

export default function Home() {
  return (
    <PortalProvider>
      <GatedFlow />
      <Toast />
    </PortalProvider>
  );
}

function GatedFlow() {
  const { state } = usePortal();
  if (state.mode === "flow") return <RespondentFlow />;
  return <LandingGate />;
}
