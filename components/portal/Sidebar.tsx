"use client";

import { usePortal } from "@/lib/store";
import { counts, totals } from "@/lib/selectors";
import { Icon, type IconName } from "@/lib/icons";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cx } from "@/lib/cx";
import type { Role, ViewKey } from "@/lib/types";

const NAV: { key: ViewKey; label: string; roles: Role[] }[] = [
  { key: "dashboard", label: "Dashboard", roles: ["admin", "enumerator", "stakeholder"] },
  { key: "respondents", label: "Respondents", roles: ["admin", "enumerator"] },
  { key: "referrals", label: "Referrals", roles: ["admin", "enumerator"] },
  { key: "qa", label: "QA Review", roles: ["admin"] },
  { key: "payouts", label: "Payouts", roles: ["admin"] },
  { key: "enumerators", label: "Enumerators", roles: ["admin"] },
  { key: "reports", label: "Reports / Export", roles: ["admin", "stakeholder"] },
  { key: "emails", label: "Emails", roles: ["admin"] },
  { key: "audit", label: "Audit Logs", roles: ["admin"] },
  { key: "settings", label: "Settings", roles: ["admin"] },
];

export function Sidebar() {
  const { state, actions } = usePortal();
  const c = counts(state.respondents);
  const { totalTarget, overallPct } = totals(state.targets, c.verified);
  const items = NAV.filter((n) => n.roles.includes(state.role));

  return (
    <nav className="flex w-[236px] flex-none flex-col gap-0.5 overflow-y-auto border-r border-line bg-white px-3 py-3.5">
      <div className="px-2.5 pb-2 pt-1.5 text-[10.5px] font-bold tracking-[.6px] text-gray-400">
        MENU
      </div>
      {items.map((n) => {
        const active = state.view === n.key;
        const badge = n.key === "qa" ? c.pendingQa : 0;
        return (
          <button
            key={n.key}
            onClick={() => actions.setView(n.key)}
            className={cx(
              "flex w-full items-center gap-[11px] rounded-[9px] px-[11px] py-[9px] text-left text-[13.5px] font-semibold",
              active ? "bg-brand-pinkSoft text-[#9D174D]" : "text-[#52525B] hover:bg-muted",
            )}
          >
            <span className={cx("flex", active ? "text-brand-pink" : "text-gray-400")}>
              <Icon name={n.key as IconName} />
            </span>
            <span className="flex-1">{n.label}</span>
            {badge > 0 && (
              <span className="min-w-[18px] rounded-[10px] bg-brand-pink px-[7px] py-px text-center text-[10.5px] font-extrabold text-white">
                {badge}
              </span>
            )}
          </button>
        );
      })}
      <div className="flex-1" />
      <div className="m-2.5 rounded-xl border border-line2 bg-muted p-[13px]">
        <div className="mb-[7px] text-[11px] font-semibold text-gray-500">Verified progress</div>
        <div className="mb-2 flex items-baseline gap-[5px]">
          <span className="text-2xl font-extrabold tracking-[-.5px]">{c.verified}</span>
          <span className="text-[13px] font-semibold text-gray-400">/ {totalTarget}</span>
        </div>
        <ProgressBar pct={overallPct} gradient height={7} trackClass="bg-line" />
        <div className="mt-[7px] text-[10.5px] font-semibold text-gray-400">
          {overallPct}% of target
        </div>
      </div>
    </nav>
  );
}
