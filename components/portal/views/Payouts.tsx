"use client";

import { usePortal } from "@/lib/store";
import { counts, payoutTotals, tok, bonusOf } from "@/lib/selectors";
import { peso, payPillClass, typeShort } from "@/lib/format";

const PAY_COLS = "1.6fr .8fr 1fr 1.1fr 1fr .9fr";

export function Payouts() {
  const { state, actions } = usePortal();
  const all = state.respondents;
  const inc = state.incentives;
  const pt = payoutTotals(all, inc);
  const c = counts(all);

  const totals = [
    { label: "Tokens pending", value: peso(pt.tokensPending), color: "#B45309" },
    { label: "Bonuses pending", value: peso(pt.bonusPending), color: "#B45309" },
    { label: "Paid out", value: peso(pt.paidTotal), color: "#15803D" },
    { label: "On hold", value: String(pt.onHold), color: "#4B5563" },
    { label: "Total verified", value: String(c.verified), color: "#18181B" },
  ];
  const rows = all.filter((r) => r.verified);

  return (
    <div className="max-w-[1240px]">
      <div className="mb-[18px] flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-.5px]">Payout tracking</h1>
          <p className="mt-1 text-[13.5px] text-gray-500">
            Tracking only — no payment gateway integration. Visible to Prodigitality Admin.
          </p>
        </div>
        <button
          onClick={() => actions.doExport("Payout report", "Excel")}
          className="flex h-[38px] items-center gap-[7px] rounded-[9px] border border-line bg-white px-[15px] text-[13px] font-semibold text-gray-700"
        >
          Export payout report
        </button>
      </div>

      <div className="mb-4 grid grid-cols-5 gap-3">
        {totals.map((p) => (
          <div key={p.label} className="rounded-[13px] border border-line bg-white px-4 py-[15px]">
            <div className="mb-2 text-[11.5px] font-semibold text-gray-500">{p.label}</div>
            <div className="text-[21px] font-extrabold tracking-[-.5px]" style={{ color: p.color }}>
              {p.value}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div
          className="grid border-b border-line2 bg-muted px-4 py-[11px] text-[11px] font-bold uppercase tracking-[.4px] text-gray-400"
          style={{ gridTemplateColumns: PAY_COLS }}
        >
          <span>Respondent</span>
          <span>Token</span>
          <span>Ref. bonus</span>
          <span>Method</span>
          <span>Payout status</span>
          <span className="text-right">Action</span>
        </div>
        {rows.map((r) => {
          const bonus = bonusOf(inc, r);
          const paidDone = r.payStatus === "Paid";
          return (
            <div
              key={r.id}
              className="grid items-center border-b border-[#F2F2F4] px-4 py-3 text-[13px]"
              style={{ gridTemplateColumns: PAY_COLS }}
            >
              <div className="min-w-0">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap font-bold">{r.name}</div>
                <div className="text-[11.5px] text-gray-400">
                  {typeShort(r.type)} · {r.acct}
                </div>
              </div>
              <span className="font-bold tabular-nums">{peso(tok(inc, r.type))}</span>
              <span
                className="font-semibold tabular-nums"
                style={{ color: bonus ? "#15803D" : "#9CA3AF" }}
              >
                {bonus ? peso(bonus) : "—"}
              </span>
              <span className="text-[12.5px] text-gray-700">{r.method}</span>
              <span>
                <span className={payPillClass(r.payStatus)}>{r.payStatus}</span>
              </span>
              <span className="text-right">
                {!paidDone ? (
                  <button
                    onClick={() => actions.markPaid(r.id)}
                    className="rounded-[7px] bg-green-700 px-[11px] py-[7px] text-[12px] font-bold text-white"
                  >
                    Mark paid
                  </button>
                ) : (
                  <span className="text-[12px] font-bold text-green-700">
                    ✓ {state.paid[r.id] || ""}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
