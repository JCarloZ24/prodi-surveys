"use client";

import { usePortal } from "@/lib/store";
import { Icon, type IconName } from "@/lib/icons";

function iconFor(key: string): IconName {
  switch (key) {
    case "flag":
      return "flag";
    case "export":
      return "csv";
    case "payout":
      return "payouts";
    case "qa":
      return "qa";
    case "ref":
      return "referrals";
    case "survey":
      return "surveys";
    case "selfie":
      return "respondents";
    case "email":
      return "reports";
    default:
      return "respondents";
  }
}

export function Audit() {
  const { state } = usePortal();

  return (
    <div className="max-w-[1080px]">
      <h1 className="mb-1 text-2xl font-extrabold tracking-[-.5px]">Audit log</h1>
      <p className="mb-5 text-[13.5px] text-gray-500">
        Every important action is recorded for traceability.
      </p>
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        {state.audit.map((a, i) => (
          <div key={i} className="flex items-center gap-3.5 border-b border-[#F2F2F4] px-4 py-3 last:border-0">
            <div
              className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-lg"
              style={{ background: a[4], color: a[5] }}
            >
              <Icon name={iconFor(a[6])} size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold">
                {a[0]} <span className="font-medium text-gray-500">{a[1]}</span>
              </div>
              <div className="text-[11.5px] text-gray-400">by {a[2]}</div>
            </div>
            <span className="whitespace-nowrap text-[11.5px] tabular-nums text-gray-400">{a[3]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
