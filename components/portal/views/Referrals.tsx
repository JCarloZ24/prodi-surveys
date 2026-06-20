"use client";

import { usePortal } from "@/lib/store";
import { referrers, refTiles } from "@/lib/selectors";
import { code as codeOf, hash, initials } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";

const REF_COLS = "1.6fr .8fr .8fr .8fr 1fr";
const REF_KINDS = ["Partner / TSI", "Respondent", "Enumerator", "Other"];

export function Referrals() {
  const { state, actions } = usePortal();
  const isAdmin = state.role === "admin";
  const all = state.respondents;
  const tiles = refTiles(all, state.incentives);
  const list = referrers(all, state.manualReferrers, state.incentives, codeOf, hash, initials);

  return (
    <div className="max-w-[1180px]">
      <h1 className="mb-1 text-2xl font-extrabold tracking-[-.5px]">Referral tracking</h1>
      <p className="mb-5 text-[13.5px] text-gray-500">
        Bonuses become eligible only after the referred respondent is Verified.
      </p>

      <div className="mb-[18px] grid grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-[13px] border border-line bg-white px-4 py-[15px]">
            <div className="mb-2 text-[11.5px] font-semibold text-gray-500">{t.label}</div>
            <div className="text-[22px] font-extrabold tracking-[-.5px]">{t.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-[11px] flex items-center justify-between">
        <h2 className="text-[15px] font-bold">Top referrers</h2>
        {isAdmin && (
          <button
            onClick={() => actions.setShowAddRef(true)}
            className="flex h-9 items-center gap-[7px] rounded-[9px] bg-brand-ink px-3.5 text-[12.5px] font-semibold text-white"
          >
            <span className="text-base leading-none">+</span> Add referrer
          </button>
        )}
      </div>

      {state.showAddRef && (
        <div className="mb-3.5 rounded-2xl border border-brand-pink bg-white p-[18px]">
          <div className="mb-1.5 text-[14px] font-bold">Add referrer</div>
          <p className="mb-3.5 text-[12px] text-gray-400">
            A unique referral code is generated automatically. Use this to pre-register partners (e.g.
            DTI, Philexport) before they refer anyone.
          </p>
          <div className="mb-3.5 grid grid-cols-[1.6fr_1fr] gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold text-gray-700">Referrer name</span>
              <input
                value={state.newRefName}
                onChange={(e) => actions.setNewRefName(e.target.value)}
                placeholder="e.g. Chamber of Commerce"
                className="h-10 w-full rounded-[9px] border border-[#E2E2E6] px-3 text-[13.5px] outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold text-gray-700">Type</span>
              <select
                value={state.newRefKind}
                onChange={(e) => actions.setNewRefKind(e.target.value)}
                className="h-10 w-full rounded-[9px] border border-[#E2E2E6] bg-white px-2.5 text-[13.5px] outline-none"
              >
                {REF_KINDS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-[9px]">
            <button
              onClick={() => actions.setShowAddRef(false)}
              className="h-[38px] rounded-[9px] border border-[#E2E2E6] bg-white px-4 text-[13px] font-bold text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={actions.addReferrer}
              className="h-[38px] rounded-[9px] bg-brand-pink px-[18px] text-[13px] font-bold text-white"
            >
              Add &amp; generate code
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div
          className="grid border-b border-line2 bg-muted px-4 py-[11px] text-[11px] font-bold uppercase tracking-[.4px] text-gray-400"
          style={{ gridTemplateColumns: REF_COLS }}
        >
          <span>Referrer</span>
          <span>Code</span>
          <span>Referred</span>
          <span>Verified</span>
          <span className="text-right">{isAdmin ? "Bonus eligible" : "Conversion"}</span>
        </div>
        {list.map((r) => (
          <div
            key={r.name}
            className="grid items-center border-b border-[#F2F2F4] px-4 py-3 text-[13px]"
            style={{ gridTemplateColumns: REF_COLS }}
          >
            <div className="flex items-center gap-2.5">
              <Avatar initials={r.initials} bg={r.avatarBg} size={30} radius={8} fontSize={11} />
              <div>
                <div className="font-bold">{r.name}</div>
                <div className="text-[11px] text-gray-400">{r.kind}</div>
              </div>
            </div>
            <span className="font-mono text-[12px] text-gray-500">{r.code}</span>
            <span className="font-semibold">{r.referred}</span>
            <span className="font-bold text-green-700">{r.verified}</span>
            <span className="text-right font-bold tabular-nums">
              {isAdmin ? r.bonusLabel : r.convLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
