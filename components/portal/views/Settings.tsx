"use client";

import { usePortal } from "@/lib/store";
import { qCount } from "@/lib/survey";
import { peso } from "@/lib/format";
import type { Incentives, Targets } from "@/lib/types";

const GROUPS: { key: keyof Targets; targetLabel: string; incLabel: string; color: string }[] = [
  { key: "TSI", targetLabel: "Trade Support Institutions (TSI)", incLabel: "Trade Support Institutions", color: "#7C3AED" },
  { key: "AgriTech", targetLabel: "Agri-Tech Providers (AFTP)", incLabel: "Agri-Tech Providers (AFTP)", color: "#059669" },
  { key: "SME", targetLabel: "Food Processing SMEs", incLabel: "Food Processing SMEs", color: "#E0195F" },
];
const PATHS: { label: string; type: keyof Incentives }[] = [
  { label: "TSI survey", type: "TSI" },
  { label: "Agri-Tech (AFTP) survey", type: "AgriTech" },
  { label: "SME survey", type: "SME" },
];

export function Settings() {
  const { state, actions } = usePortal();
  const dirty =
    JSON.stringify(state.draftTargets) !== JSON.stringify(state.targets) ||
    JSON.stringify(state.draftIncentives) !== JSON.stringify(state.incentives);
  const totalTarget = state.draftTargets.TSI + state.draftTargets.AgriTech + state.draftTargets.SME;

  return (
    <div className="max-w-[900px]">
      <h1 className="mb-1 text-2xl font-extrabold tracking-[-.5px]">Settings</h1>
      <p className="mb-5 text-[13.5px] text-gray-500">
        Targets, incentive structure &amp; survey paths.
      </p>

      <div className="mb-[11px] flex items-center justify-between">
        <h2 className="text-[15px] font-bold">Target respondents per path</h2>
        <span className="text-[12.5px] font-semibold text-gray-500">
          Total target: <b className="text-brand-ink">{totalTarget}</b>
        </span>
      </div>
      <div className="mb-[22px] rounded-2xl border border-line bg-white px-[18px] py-2">
        {GROUPS.map((g) => (
          <div key={g.key} className="flex items-center gap-3 border-b border-[#F2F2F4] py-[13px] last:border-0">
            <span className="h-[9px] w-[9px] flex-none rounded-[3px]" style={{ background: g.color }} />
            <span className="flex-1 text-[13.5px] font-semibold text-gray-700">{g.targetLabel}</span>
            <input
              value={state.draftTargets[g.key]}
              onChange={(e) => actions.setTarget(g.key, e.target.value)}
              type="number"
              min={0}
              className="h-[38px] w-[90px] rounded-[9px] border border-[#E2E2E6] px-3 text-center text-sm font-bold tabular-nums outline-none"
            />
          </div>
        ))}
      </div>

      <div className="mb-[11px] flex items-center justify-between">
        <h2 className="text-[15px] font-bold">Token &amp; referral structure</h2>
        <span className="text-[12px] font-semibold text-gray-400">Amounts in ₱ · editable</span>
      </div>
      <div className="mb-[22px] overflow-hidden rounded-2xl border border-line bg-white">
        <div className="grid grid-cols-[2fr_1.1fr_1.1fr_1fr] border-b border-line2 bg-muted px-4 py-[11px] text-[11px] font-bold uppercase tracking-[.4px] text-gray-400">
          <span>Group</span>
          <span>Respondent token</span>
          <span>Referral bonus</span>
          <span className="text-right">Total / verified</span>
        </div>
        {GROUPS.map((g) => {
          const inc = state.draftIncentives[g.key];
          return (
            <div
              key={g.key}
              className="grid grid-cols-[2fr_1.1fr_1.1fr_1fr] items-center gap-2 border-b border-[#F2F2F4] px-4 py-3 text-[13.5px] last:border-0"
            >
              <span className="flex items-center gap-[9px] font-bold">
                <span className="h-[9px] w-[9px] flex-none rounded-[3px]" style={{ background: g.color }} />
                {g.incLabel}
              </span>
              <span className="flex items-center gap-[5px]">
                <span className="font-semibold text-gray-400">₱</span>
                <input
                  value={inc.token}
                  onChange={(e) => actions.setIncentive(g.key, "token", e.target.value)}
                  type="number"
                  min={0}
                  className="h-9 w-[84px] rounded-lg border border-[#E2E2E6] px-2.5 text-[13.5px] font-bold tabular-nums outline-none"
                />
              </span>
              <span className="flex items-center gap-[5px]">
                <span className="font-semibold text-gray-400">₱</span>
                <input
                  value={inc.bonus}
                  onChange={(e) => actions.setIncentive(g.key, "bonus", e.target.value)}
                  type="number"
                  min={0}
                  className="h-9 w-[84px] rounded-lg border border-[#E2E2E6] px-2.5 text-[13.5px] font-bold tabular-nums outline-none"
                />
              </span>
              <span className="text-right font-bold tabular-nums">{peso(inc.token + inc.bonus)}</span>
            </div>
          );
        })}
      </div>

      <h2 className="mb-[11px] text-[15px] font-bold">Survey paths</h2>
      <div className="grid grid-cols-3 gap-3">
        {PATHS.map((s) => (
          <div key={s.label} className="rounded-[13px] border border-line bg-white p-4">
            <div className="mb-[5px] text-[14px] font-bold">{s.label}</div>
            <div className="mb-[11px] text-[12px] text-gray-400">
              {qCount(s.type)} questions · conditional logic
            </div>
            <span className="rounded-md bg-green-100 px-[9px] py-1 text-[11px] font-bold text-green-700">
              Active
            </span>
          </div>
        ))}
      </div>

      {/* Sticky save bar */}
      <div
        className="sticky bottom-0 mt-6 flex items-center gap-3.5 rounded-[13px] border bg-white/90 p-3.5 px-4 shadow-[0_6px_20px_rgba(0,0,0,.06)] backdrop-blur-md"
        style={{ borderColor: dirty ? "#FED7AA" : "#E7E7EA" }}
      >
        <span className="flex-1 text-[13px] font-semibold" style={{ color: dirty ? "#9A3412" : "#15803D" }}>
          {dirty ? "You have unsaved changes to targets or incentives." : "All changes saved."}
        </span>
        {dirty && (
          <button
            onClick={actions.discardSettings}
            className="h-10 rounded-[10px] border border-[#E2E2E6] bg-white px-4 text-[13.5px] font-bold text-gray-700"
          >
            Discard
          </button>
        )}
        <button
          onClick={actions.askSaveSettings}
          disabled={!dirty}
          className="h-10 rounded-[10px] px-5 text-[13.5px] font-bold text-white"
          style={{ background: dirty ? "#15803D" : "#D4D4D8", cursor: dirty ? "pointer" : "not-allowed" }}
        >
          Save changes
        </button>
      </div>
    </div>
  );
}
