"use client";

import { usePortal } from "@/lib/store";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { ProfileDrawer } from "./ProfileDrawer";
import { SaveConfirmModal } from "./SaveConfirmModal";
import { Dashboard } from "./views/Dashboard";
import { Respondents } from "./views/Respondents";
import { QaReview } from "./views/QaReview";
import { Payouts } from "./views/Payouts";
import { Referrals } from "./views/Referrals";
import { Enumerators } from "./views/Enumerators";
import { Reports } from "./views/Reports";
import { Audit } from "./views/Audit";
import { Emails } from "./views/Emails";
import { Settings } from "./views/Settings";

export function PortalShell() {
  const { state } = usePortal();
  const v = state.view;

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto px-[30px] pb-[60px] pt-[26px]">
          {v === "dashboard" && <Dashboard />}
          {v === "respondents" && <Respondents />}
          {v === "qa" && <QaReview />}
          {v === "payouts" && <Payouts />}
          {v === "referrals" && <Referrals />}
          {v === "enumerators" && <Enumerators />}
          {v === "reports" && <Reports />}
          {v === "audit" && <Audit />}
          {v === "emails" && <Emails />}
          {v === "settings" && <Settings />}
        </main>
      </div>
      {state.selectedId != null && <ProfileDrawer />}
      {state.confirmSave && <SaveConfirmModal />}
    </div>
  );
}
