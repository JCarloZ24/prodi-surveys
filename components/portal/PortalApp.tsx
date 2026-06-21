"use client";

import { PortalProvider } from "@/lib/store";
import { StaffPortal } from "./StaffPortal";
import type { Respondent, Role } from "@/lib/types";

interface Props {
  initialRole: Role;
  initialRespondents: Respondent[];
}

export function PortalApp({ initialRole, initialRespondents }: Props) {
  return (
    <PortalProvider
      initialMode="portal"
      initialRole={initialRole}
      initialRespondents={initialRespondents}
    >
      <StaffPortal />
    </PortalProvider>
  );
}
