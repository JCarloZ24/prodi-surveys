"use client";

import { usePortal } from "@/lib/store";
import {
  counts,
  totals,
  groups,
  funnel,
  payoutTotals,
  refTiles,
} from "@/lib/selectors";
import { peso } from "@/lib/format";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function Dashboard() {
  const { state, actions } = usePortal();
  const role = state.role;
  const isAdmin = role === "admin";
  const isEnum = role === "enumerator";
  const isStake = role === "stakeholder";
  const all = state.respondents;

  const c = counts(all);
  const { totalTarget, remaining } = totals(state.targets, c.verified);
  const g = groups(all, state.targets);
  const fn = funnel(all, c);
  const pt = payoutTotals(all, state.incentives);
  const rTiles = refTiles(all, state.incentives);

  const dashTitle = isStake ? "Project progress" : isEnum ? "My fieldwork" : "Operations dashboard";
  const dashSubtitle = isStake
    ? "Read-only view · Prodigitality baseline data collection"
    : isEnum
      ? "Maria Santos · assigned respondents"
      : totalTarget + " verified respondents target · mid-project";

  const statCards: { label: string; value: number; sub: string; color: string }[] = [
    { label: "Registered", value: c.registered, sub: "", color: "#18181B" },
    { label: "Email verified", value: c.emailV, sub: "", color: "#18181B" },
    { label: "Survey done", value: c.surveyDone, sub: "", color: "#18181B" },
    { label: "Selfie", value: c.selfieN, sub: "", color: "#18181B" },
    { label: "Verified", value: c.verified, sub: "/" + totalTarget, color: "#15803D" },
    { label: "Remaining", value: remaining, sub: "to target", color: "#E0195F" },
  ];

  const qaTiles = [
    { label: "Pending review", value: c.pendingQa, bg: "#FFFBEB", fg: "#B45309" },
    { label: "Verified", value: c.verified, bg: "#F0FDF4", fg: "#15803D" },
    { label: "Needs follow-up", value: c.followup, bg: "#FFF7ED", fg: "#9A3412" },
    { label: "Flagged", value: c.flagged, bg: "#FEF2F2", fg: "#B91C1C" },
  ];
  const payTiles = [
    { label: "Tokens pending", value: peso(pt.tokensPending) },
    { label: "Bonuses pending", value: peso(pt.bonusPending) },
    { label: "Paid out", value: peso(pt.paidTotal) },
    { label: "On hold", value: String(pt.onHold) },
  ];

  return (
    <div className="max-w-[1180px]">
      <div className="mb-[22px] flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-.5px]">{dashTitle}</h1>
          <p className="mt-1 text-[13.5px] text-gray-500">{dashSubtitle}</p>
        </div>
        <button
          onClick={() => actions.doExport("Progress report", "CSV")}
          className="flex h-[38px] items-center gap-[7px] rounded-[9px] bg-brand-ink px-[15px] text-[13px] font-semibold text-white"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12" />
            <path d="M7 10l5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
          Export report
        </button>
      </div>

      {/* Stat cards */}
      <div className="mb-3.5 grid grid-cols-6 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-line bg-white px-4 py-[15px]">
            <div className="mb-[9px] overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] font-semibold text-gray-500">
              {card.label}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[26px] font-extrabold tracking-[-.6px]" style={{ color: card.color }}>
                {card.value}
              </span>
              <span className="text-[12px] font-semibold text-gray-400">{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Progress by group */}
      <div className="mb-3.5 rounded-2xl border border-line bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-bold">Progress by respondent group</h2>
          <span className="text-[12px] font-semibold text-gray-400">Verified vs target</span>
        </div>
        <div className="grid grid-cols-3 gap-[18px]">
          {g.map((grp) => (
            <div key={grp.label}>
              <div className="mb-2.5 flex items-center gap-[9px]">
                <span className="h-[9px] w-[9px] flex-none rounded-[3px]" style={{ background: grp.color }} />
                <span className="flex-1 text-[13.5px] font-bold">{grp.label}</span>
                <span className="text-[13px] font-bold">
                  <span style={{ color: grp.color }}>{grp.verified}</span>
                  <span className="text-[#C4C4CC]">/{grp.target}</span>
                </span>
              </div>
              <div className="mb-[9px]">
                <ProgressBar pct={grp.pct} color={grp.color} height={9} trackClass="bg-[#F1F1F3]" />
              </div>
              <div className="flex gap-3.5">
                <span className="text-[11.5px] font-medium text-gray-500">{grp.pendingQa} in QA</span>
                <span className="text-[11.5px] font-medium text-gray-500">{grp.inProgress} in progress</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel + QA card */}
      <div className="mb-3.5 grid grid-cols-[1.4fr_1fr] gap-3.5">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="mb-4 text-[15px] font-bold">Verification funnel</h2>
          <div className="flex flex-col gap-[11px]">
            {fn.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="w-[130px] flex-none text-[12.5px] font-semibold text-gray-700">
                  {f.label}
                </span>
                <div className="relative h-[22px] flex-1 overflow-hidden rounded-md bg-[#F4F4F6]">
                  <div
                    className="h-full rounded-md"
                    style={{ width: f.pct + "%", background: "linear-gradient(90deg,#F0246A,#FB923C)" }}
                  />
                </div>
                <span className="w-[34px] text-right text-[13px] font-bold">{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        {(isAdmin || isEnum) && (
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-bold">QA review</h2>
              <button
                onClick={() => actions.setView("qa")}
                className="text-[12px] font-bold text-brand-pink"
              >
                Open queue →
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {qaTiles.map((q) => (
                <div
                  key={q.label}
                  className="rounded-[11px] border border-line2 p-[13px]"
                  style={{ background: q.bg }}
                >
                  <div className="text-[22px] font-extrabold tracking-[-.5px]" style={{ color: q.fg }}>
                    {q.value}
                  </div>
                  <div className="mt-0.5 text-[11.5px] font-semibold text-gray-500">{q.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Referral + payout (admin only) */}
      {isAdmin && (
        <div className="grid grid-cols-2 gap-3.5">
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-bold">Referrals</h2>
              <button onClick={() => actions.setView("referrals")} className="text-[12px] font-bold text-brand-pink">
                View all →
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {rTiles.map((r) => (
                <div key={r.label} className="rounded-[11px] border border-line2 p-[13px]">
                  <div className="text-[20px] font-extrabold tracking-[-.5px]">{r.value}</div>
                  <div className="mt-0.5 text-[11.5px] font-semibold text-gray-500">{r.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div
            className="rounded-2xl border border-[#2A1850] p-5 text-white"
            style={{ background: "linear-gradient(135deg,#1F1147,#3A1655)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-bold">
                Payouts
                <span className="ml-1.5 rounded-[5px] bg-white/15 px-[7px] py-0.5 align-middle text-[10px] font-bold">
                  ADMIN
                </span>
              </h2>
              <button onClick={() => actions.setView("payouts")} className="text-[12px] font-bold text-[#FCA5C7]">
                Manage →
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {payTiles.map((p) => (
                <div key={p.label} className="rounded-[11px] border border-white/10 bg-white/[.07] p-[13px]">
                  <div className="text-[18px] font-extrabold tracking-[-.5px]">{p.value}</div>
                  <div className="mt-0.5 text-[11px] font-semibold text-white/70">{p.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isStake && (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-pinkLine bg-brand-pinkSoft2 px-[18px] py-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E0195F" strokeWidth="2" strokeLinecap="round">
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          <span className="text-[13px] font-medium text-[#9D174D]">
            You are viewing the <b>read-only stakeholder dashboard</b>. Finance, payouts, selfies and
            personal contact details are hidden.
          </span>
        </div>
      )}
    </div>
  );
}
