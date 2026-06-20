"use client";

import { usePortal } from "@/lib/store";
import { Icon, type IconName } from "@/lib/icons";

interface ExportItem {
  label: string;
  desc: string;
  bg: string;
  fg: string;
  key: IconName;
  formats: string[];
}

export function Reports() {
  const { state, actions } = usePortal();
  const isAdmin = state.role === "admin";
  const all = state.respondents;

  const allItems: ExportItem[] = [
    { label: "Full respondent list", desc: "All " + all.length + " records", bg: "#FFE4E6", fg: "#9F1239", key: "reports", formats: ["CSV", "Excel"] },
    { label: "Verified respondents", desc: "Verified only", bg: "#DCFCE7", fg: "#166534", key: "respondents", formats: ["CSV", "Excel"] },
    { label: "Survey answers", desc: "KoboToolbox-compatible", bg: "#EDE9FE", fg: "#5B21B6", key: "surveys", formats: ["CSV", "Kobo"] },
    { label: "Referral report", desc: "Referrers & conversions", bg: "#FCE7F3", fg: "#9D174D", key: "referrals", formats: ["CSV", "Excel"] },
    { label: "Payout report", desc: "Admin only", bg: "#FEF3C7", fg: "#92400E", key: "payouts", formats: ["CSV", "Excel"] },
    { label: "Audit log", desc: "Full action history", bg: "#F3F4F6", fg: "#4B5563", key: "audit", formats: ["CSV"] },
  ];
  const items = allItems.filter((x) =>
    isAdmin ? true : ["Full respondent list", "Verified respondents", "Survey answers"].includes(x.label),
  );

  return (
    <div className="max-w-[980px]">
      <h1 className="mb-1 text-2xl font-extrabold tracking-[-.5px]">Reports &amp; Export</h1>
      <p className="mb-5 text-[13.5px] text-gray-500">
        Survey answers export in a KoboToolbox-compatible structure for the research team.
      </p>
      <div className="grid grid-cols-2 gap-[13px]">
        {items.map((x) => (
          <div
            key={x.label}
            className="flex items-center gap-3.5 rounded-[13px] border border-line bg-white p-[17px]"
          >
            <div
              className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[11px]"
              style={{ background: x.bg, color: x.fg }}
            >
              <Icon name={x.key} size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold">{x.label}</div>
              <div className="text-[12px] text-gray-400">{x.desc}</div>
            </div>
            <div className="flex gap-1.5">
              {x.formats.map((f) => (
                <button
                  key={f}
                  onClick={() => actions.doExport(x.label, f)}
                  className="rounded-[7px] bg-gray-100 px-2.5 py-[7px] text-[11.5px] font-bold text-gray-700"
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
