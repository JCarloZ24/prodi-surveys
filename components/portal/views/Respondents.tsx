"use client";

import { usePortal } from "@/lib/store";
import { filteredRows, tok } from "@/lib/selectors";
import { initials, peso, statusPillClass, typePillClass, typeShort } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { cx } from "@/lib/cx";

const TYPE_FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "TSI", label: "TSI" },
  { key: "AgriTech", label: "Agri-Tech" },
  { key: "SME", label: "SME" },
];
const STATUS_OPTIONS = [
  "all",
  "New",
  "Email Verified",
  "Survey Completed",
  "Selfie Submitted",
  "Pending QA",
  "Needs Follow-up",
  "Verified",
  "Rejected",
];

export function Respondents() {
  const { state, actions } = usePortal();
  const isAdmin = state.role === "admin";
  const isEnum = state.role === "enumerator";
  const all = state.respondents;
  const rows = filteredRows(all, state.role, {
    filterType: state.filterType,
    filterStatus: state.filterStatus,
    flaggedOnly: state.flaggedOnly,
    search: state.search,
  });
  const totalRespondents = isEnum
    ? all.filter((r) => r.enumerator === "Maria Santos").length
    : all.length;
  const cols = isAdmin
    ? "2fr .9fr .9fr 1fr 1.1fr 1.2fr .7fr .8fr"
    : "2.2fr .9fr 1fr 1fr 1.3fr .7fr";

  return (
    <div className="max-w-[1240px]">
      <div className="mb-[18px] flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-.5px]">
            {isEnum ? "My respondents" : "Respondents"}
          </h1>
          <p className="mt-1 text-[13.5px] text-gray-500">
            {rows.length} of {totalRespondents} respondents shown
          </p>
        </div>
        <button
          onClick={() => actions.doExport("Respondent list", "CSV")}
          className="flex h-[38px] items-center gap-[7px] rounded-[9px] border border-line bg-white px-[15px] text-[13px] font-semibold text-gray-700"
        >
          Export CSV
        </button>
      </div>

      <div className="mb-3.5 flex flex-wrap gap-2">
        {TYPE_FILTERS.map((t) => {
          const active = state.filterType === t.key;
          return (
            <button
              key={t.key}
              onClick={() => actions.setFilterType(t.key)}
              className={cx(
                "h-[34px] rounded-lg border px-3.5 text-[12.5px] font-bold",
                active ? "border-brand-pink bg-brand-pinkSoft text-[#9D174D]" : "border-line bg-white text-zinc-500",
              )}
            >
              {t.label}
            </button>
          );
        })}
        <div className="mx-1 my-1 w-px bg-line" />
        <select
          value={state.filterStatus}
          onChange={(e) => actions.setFilterStatus(e.target.value)}
          className="h-[34px] cursor-pointer rounded-lg border border-line bg-white px-2.5 text-[12.5px] font-semibold text-gray-700"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s}
            </option>
          ))}
        </select>
        <label className="flex h-[34px] cursor-pointer items-center gap-[7px] rounded-lg border border-line bg-white px-3 text-[12.5px] font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={state.flaggedOnly}
            onChange={actions.toggleFlagged}
            className="accent-brand-pink"
          />
          Flagged only
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div
          className="grid border-b border-line2 bg-muted px-4 py-[11px] text-[11px] font-bold uppercase tracking-[.4px] text-gray-400"
          style={{ gridTemplateColumns: cols }}
        >
          <span>Respondent</span>
          <span>Type</span>
          <span>Region</span>
          <span>Mode</span>
          {isAdmin && <span>Enumerator</span>}
          <span>Status</span>
          <span>Flags</span>
          {isAdmin && <span className="text-right">Token</span>}
        </div>

        {rows.map((r) => (
          <div
            key={r.id}
            onClick={() => actions.openProfile(r.id)}
            className="grid cursor-pointer items-center border-b border-[#F2F2F4] px-4 py-3 text-[13px] hover:bg-muted"
            style={{ gridTemplateColumns: cols }}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar initials={initials(r.name).toUpperCase()} bg={r.color} size={32} radius={8} />
              <div className="min-w-0">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap font-bold">{r.name}</div>
                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] text-gray-400">
                  {r.org}
                </div>
              </div>
            </div>
            <span>
              <span className={typePillClass(r.type)}>{typeShort(r.type)}</span>
            </span>
            <span className="text-[12.5px] text-gray-500">{r.region}</span>
            <span
              className="text-[11px] font-semibold"
              style={{ color: r.mode === "Self-service" ? "#0891B2" : "#7C3AED" }}
            >
              {r.mode}
            </span>
            {isAdmin && (
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] text-gray-500">
                {r.enumerator}
              </span>
            )}
            <span>
              <span className={statusPillClass(r.status as string)}>{r.status}</span>
            </span>
            <span>
              {r.flags.length ? (
                <span className="rounded-[5px] bg-red-100 px-[7px] py-0.5 text-[11px] font-bold text-red-700">
                  ⚠ {r.flags.length}
                </span>
              ) : (
                <span className="text-[#D4D4D8]">—</span>
              )}
            </span>
            {isAdmin && (
              <span className="text-right font-bold tabular-nums">
                {peso(tok(state.incentives, r.type))}
              </span>
            )}
          </div>
        ))}

        {rows.length === 0 && (
          <div className="p-12 text-center text-[13.5px] text-gray-400">
            No respondents match these filters.
          </div>
        )}
      </div>
    </div>
  );
}
