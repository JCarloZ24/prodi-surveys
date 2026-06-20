"use client";

import { PortalProvider } from "@/lib/store";
import { RespondentFlow } from "@/components/flow/RespondentFlow";
import { Toast } from "@/components/ui/Toast";

export default function Home() {
  return (
    <PortalProvider>
      <RespondentFlow />
      <Toast />
    </PortalProvider>
  );
}
