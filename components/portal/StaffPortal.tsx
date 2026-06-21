"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePortal, USER_NAMES } from "@/lib/store";
import {
  counts,
  enumCards,
  filteredRows,
  funnel,
  groups,
  payoutTotals,
  refTiles,
  referrers,
  tok,
  bon,
  totals,
} from "@/lib/selectors";
import {
  avatarColor,
  code as codeOf,
  hash,
  initials,
  payPillClass,
  peso,
  statusPillClass,
  typePillClass,
  typeShort,
} from "@/lib/format";
import { emailDefs } from "@/lib/emails";
import { cx } from "@/lib/cx";
import { LogoMark } from "@/lib/icons";
import type { ViewKey } from "@/lib/types";

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS: { key: ViewKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
  },
  {
    key: "respondents",
    label: "Respondents",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  },
  {
    key: "referrals",
    label: "Referrals",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" /></svg>,
  },
  {
    key: "qa",
    label: "QA Review",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
  },
  {
    key: "payouts",
    label: "Payouts",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
  },
  {
    key: "enumerators",
    label: "Enumerators",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><path d="M12 11v4M10 13h4" /></svg>,
  },
  {
    key: "reports",
    label: "Reports",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
  },
  {
    key: "emails",
    label: "Emails",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
  },
  {
    key: "audit",
    label: "Audit Log",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  },
  {
    key: "settings",
    label: "Settings",
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  },
];

const VIEW_LABELS: Record<ViewKey, string> = {
  dashboard: "Dashboard",
  respondents: "Respondents",
  referrals: "Referrals",
  qa: "QA Review",
  payouts: "Payouts",
  enumerators: "Enumerators",
  reports: "Reports",
  emails: "Emails",
  audit: "Audit Log",
  settings: "Settings",
};

// ─── Shell ─────────────────────────────────────────────────────────────────────

export function StaffPortal() {
  const { state, actions } = usePortal();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/portal/auth", { method: "DELETE" });
    router.push("/portal/login");
    router.refresh();
  };

  const userName = USER_NAMES[state.role];
  const userInitials = initials(userName);
  const userColor = avatarColor(userName);

  const allowedViews: ViewKey[] =
    state.role === "stakeholder"
      ? ["dashboard", "respondents", "referrals", "reports", "audit"]
      : NAV_ITEMS.map((n) => n.key);

  const navItems = NAV_ITEMS.filter((n) => allowedViews.includes(n.key));
  const pendingQa = state.respondents.filter((r) => r.status === "Pending QA").length;

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ background: "linear-gradient(180deg, #1F1147 0%, #3A1655 100%)" }}
      >
        {/* Logo */}
        <div className="flex h-[64px] flex-none items-center gap-2.5 px-5">
          <LogoMark size={26} />
          <div className="text-[14.5px] font-extrabold tracking-[-.3px] text-white/90">
            Prodi-Surveys
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-1">
          {navItems.map((item) => {
            const active = state.view === item.key;
            const badge = item.key === "qa" && pendingQa > 0 ? pendingQa : 0;
            return (
              <button
                key={item.key}
                onClick={() => { actions.setView(item.key); setSidebarOpen(false); }}
                className={cx(
                  "flex w-full items-center gap-3 rounded-[9px] px-3 py-[9px] text-[13px] font-semibold transition-colors",
                  active ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/8 hover:text-white/80",
                )}
              >
                <span className="flex-none opacity-80">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {badge > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-pink text-[11px] font-extrabold text-white">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[12px] font-extrabold text-white"
              style={{ background: userColor }}
            >
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-bold text-white/90">{userName}</div>
              <div className="text-[11px] capitalize text-white/45">{state.role}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex-none text-white/40 hover:text-white/70"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-[64px] flex-none items-center gap-4 border-b border-line bg-white px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex-none text-gray-400 lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="text-[16px] font-extrabold tracking-[-.3px] text-brand-ink">
            {VIEW_LABELS[state.view]}
          </h1>
          <div className="flex-1" />
          {(state.view === "respondents" || state.view === "qa") && (
            <div className="relative hidden sm:block">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={state.search}
                onChange={(e) => actions.setSearch(e.target.value)}
                placeholder="Search respondents…"
                className="h-9 w-[240px] rounded-[9px] border border-line bg-surface pl-9 pr-3.5 text-[13px] focus:border-brand-pink focus:outline-none"
              />
            </div>
          )}
          {state.role !== "stakeholder" && (
            <button
              onClick={actions.launchFlow}
              className="flex h-9 items-center gap-2 rounded-[9px] bg-brand-ink px-4 text-[13px] font-bold text-white"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New respondent
            </button>
          )}
        </header>

        {/* View content */}
        <main className="flex-1 overflow-y-auto p-6">
          {state.view === "dashboard"    && <Dashboard />}
          {state.view === "respondents"  && <RespondentsView />}
          {state.view === "qa"           && <QaView />}
          {state.view === "payouts"      && <PayoutsView />}
          {state.view === "referrals"    && <ReferralsView />}
          {state.view === "enumerators"  && <EnumeratorsView />}
          {state.view === "reports"      && <ReportsView />}
          {state.view === "emails"       && <EmailsView />}
          {state.view === "audit"        && <AuditView />}
          {state.view === "settings"     && <SettingsView />}
        </main>
      </div>

      {/* Profile drawer */}
      {state.selectedId != null && <ProfileDrawer />}

      {/* Toast */}
      {state.toast && (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-[11px] bg-brand-ink px-5 py-3 text-[13px] font-semibold text-white shadow-xl">
          {state.toast}
        </div>
      )}
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="mb-1 text-[12px] font-semibold uppercase tracking-[.4px] text-gray-400">{label}</div>
      <div className="text-[28px] font-extrabold tracking-[-.5px]" style={{ color: color || "#18181B" }}>
        {value}
      </div>
      {sub && <div className="mt-1 text-[12px] text-gray-400">{sub}</div>}
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard() {
  const { state, actions } = usePortal();
  const c = useMemo(() => counts(state.respondents), [state.respondents]);
  const grps = useMemo(() => groups(state.respondents, state.targets), [state.respondents, state.targets]);
  const { totalTarget, remaining, overallPct } = useMemo(() => totals(state.targets, c.verified), [state.targets, c.verified]);
  const funnelSteps = useMemo(() => funnel(state.respondents, c), [state.respondents, c]);

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Registered" value={c.registered} sub={`target ${totalTarget}`} />
        <StatCard label="Verified" value={c.verified} sub={overallPct + "% of target"} color="#15803D" />
        <StatCard label="Pending QA" value={c.pendingQa} color="#D97706" />
        <StatCard label="Remaining" value={remaining} sub="to reach target" />
      </div>

      {/* Group progress */}
      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="mb-4 text-[13px] font-bold text-brand-ink">Progress by group</div>
        <div className="space-y-4">
          {grps.map((g) => (
            <div key={g.label}>
              <div className="mb-1 flex items-center justify-between text-[12.5px]">
                <span className="font-semibold text-gray-700">{g.label}</span>
                <span className="font-bold" style={{ color: g.color }}>
                  {g.verified} / {g.target}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#EFEFF1]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, g.pct)}%`, background: g.color }}
                />
              </div>
              <div className="mt-1 flex gap-3 text-[11.5px] text-gray-400">
                <span>{g.pendingQa} pending QA</span>
                <span>{g.inProgress} in progress</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel + QA card */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Funnel */}
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="mb-3 text-[13px] font-bold text-brand-ink">Submission funnel</div>
          <div className="space-y-2">
            {funnelSteps.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-[130px] flex-none text-[12px] font-semibold text-gray-500">{s.label}</div>
                <div className="flex-1 overflow-hidden rounded-full bg-[#EFEFF1]" style={{ height: 7 }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${s.pct}%`, background: "#E0195F" }}
                  />
                </div>
                <div className="w-[32px] flex-none text-right text-[12px] font-bold text-gray-700">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="space-y-4">
          {c.pendingQa > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="mb-1 text-[13px] font-bold text-amber-800">{c.pendingQa} submission{c.pendingQa !== 1 ? "s" : ""} pending QA</div>
              <p className="mb-3 text-[12.5px] text-amber-700">Review, approve, or flag submissions.</p>
              <button
                onClick={() => actions.setView("qa")}
                className="rounded-[9px] bg-amber-700 px-4 py-2 text-[12.5px] font-bold text-white"
              >
                Go to QA Review →
              </button>
            </div>
          )}
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 text-[13px] font-bold text-brand-ink">Recent activity</div>
            <div className="space-y-2.5">
              {state.audit.slice(0, 5).map((entry, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div
                    className="mt-[2px] flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-bold"
                    style={{ background: entry[4], color: entry[5] }}
                  >
                    ·
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold text-gray-700">{entry[0]} <span className="text-gray-400">{entry[1]}</span></div>
                    <div className="text-[11.5px] text-gray-400">{entry[2]} · {entry[3]}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Respondents table ────────────────────────────────────────────────────────

function RespondentsView() {
  const { state, actions } = usePortal();
  const rows = useMemo(
    () => filteredRows(state.respondents, state.role, {
      filterType: state.filterType,
      filterStatus: state.filterStatus,
      flaggedOnly: state.flaggedOnly,
      search: state.search,
    }),
    [state.respondents, state.role, state.filterType, state.filterStatus, state.flaggedOnly, state.search],
  );

  const typeOpts = ["all", "TSI", "AgriTech", "SME"];
  const statusOpts = ["all", "Pending QA", "Verified", "Needs Follow-up", "Rejected"];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-[9px] bg-white p-1 border border-line">
          {typeOpts.map((t) => (
            <button
              key={t}
              onClick={() => actions.setFilterType(t)}
              className={cx(
                "rounded-[7px] px-3 py-1.5 text-[12.5px] font-semibold",
                state.filterType === t ? "bg-brand-ink text-white" : "text-gray-500 hover:text-gray-700",
              )}
            >
              {t === "all" ? "All types" : typeShort(t)}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-[9px] bg-white p-1 border border-line">
          {statusOpts.map((s) => (
            <button
              key={s}
              onClick={() => actions.setFilterStatus(s)}
              className={cx(
                "rounded-[7px] px-3 py-1.5 text-[12.5px] font-semibold",
                state.filterStatus === s ? "bg-brand-ink text-white" : "text-gray-500 hover:text-gray-700",
              )}
            >
              {s === "all" ? "All status" : s}
            </button>
          ))}
        </div>
        <button
          onClick={actions.toggleFlagged}
          className={cx(
            "rounded-[9px] border px-3 py-1.5 text-[12.5px] font-semibold",
            state.flaggedOnly ? "border-red-300 bg-red-50 text-red-700" : "border-line bg-white text-gray-500",
          )}
        >
          🚩 Flagged only
        </button>
        <span className="ml-auto text-[12px] text-gray-400">{rows.length} respondent{rows.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Mobile search */}
      <div className="relative sm:hidden">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
        <input
          value={state.search}
          onChange={(e) => actions.setSearch(e.target.value)}
          placeholder="Search…"
          className="h-10 w-full rounded-[9px] border border-line bg-white pl-9 pr-4 text-[13px] focus:border-brand-pink focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        {rows.length === 0 ? (
          <div className="py-14 text-center text-[13.5px] text-gray-400">No respondents match the current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-[#F2F2F4]">
                  {["Respondent", "Org", "Type", "Status", "Payout", "Referred", "Code"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[.4px] text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => actions.openProfile(r.id)}
                    className="cursor-pointer border-b border-[#F5F5F7] hover:bg-brand-pinkSoft2 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[12px] font-extrabold text-white"
                          style={{ background: avatarColor(r.name) }}
                        >
                          {initials(r.name)}
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-brand-ink">{r.name}</div>
                          <div className="text-[11.5px] text-gray-400">{r.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-gray-600">{r.org}</td>
                    <td className="px-4 py-3"><span className={typePillClass(r.type)}>{typeShort(r.type)}</span></td>
                    <td className="px-4 py-3"><span className={statusPillClass(r.status)}>{r.status}</span></td>
                    <td className="px-4 py-3"><span className={payPillClass(r.payStatus)}>{r.payStatus}</span></td>
                    <td className="px-4 py-3 text-[12.5px] text-gray-500">{r.referred ? r.referrer ?? "Yes" : "—"}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-gray-500">{r.code || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── QA view ─────────────────────────────────────────────────────────────────

function QaView() {
  const { state, actions } = usePortal();
  const queue = useMemo(
    () => state.respondents.filter((r) =>
      r.status === "Pending QA" || r.status === "Needs Follow-up"
    ),
    [state.respondents],
  );
  const filtered = state.search.trim()
    ? queue.filter((r) => r.name.toLowerCase().includes(state.search.toLowerCase()) || r.org.toLowerCase().includes(state.search.toLowerCase()))
    : queue;

  return (
    <div className="space-y-3">
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 py-14 text-center">
          <div className="text-[32px]">✓</div>
          <div className="mt-2 text-[14px] font-bold text-green-800">All clear — no pending submissions</div>
        </div>
      ) : (
        filtered.map((r) => (
          <div key={r.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-[13px] font-extrabold text-white"
                style={{ background: avatarColor(r.name) }}
              >
                {initials(r.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[14px] font-bold text-brand-ink">{r.name}</span>
                  <span className={typePillClass(r.type)}>{typeShort(r.type)}</span>
                  <span className={statusPillClass(r.status)}>{r.status}</span>
                </div>
                <div className="text-[12.5px] text-gray-500">{r.org} · {r.email}</div>
                <div className="mt-2 flex flex-wrap gap-3 text-[12px] text-gray-400">
                  <span>📸 Selfie: {r.selfie ? "Submitted" : "Missing"}</span>
                  <span>💳 Payout: {r.method ?? "—"}</span>
                  {r.referred && <span>🔗 Referred by {r.referrer}</span>}
                </div>
              </div>
              <button
                onClick={() => actions.openProfile(r.id)}
                className="flex-none rounded-[9px] border border-line bg-surface px-3 py-1.5 text-[12.5px] font-semibold text-gray-600 hover:bg-white"
              >
                View
              </button>
            </div>
            {state.role !== "stakeholder" && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => actions.qaAct(r.id, "approve")}
                  className="flex-1 rounded-[9px] bg-green-600 py-2 text-[13px] font-bold text-white hover:bg-green-700"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => actions.qaAct(r.id, "follow")}
                  className="flex-1 rounded-[9px] bg-amber-500 py-2 text-[13px] font-bold text-white hover:bg-amber-600"
                >
                  ⚑ Follow-up
                </button>
                <button
                  onClick={() => actions.qaAct(r.id, "reject")}
                  className="flex-1 rounded-[9px] bg-red-500 py-2 text-[13px] font-bold text-white hover:bg-red-600"
                >
                  ✕ Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ─── Payouts ─────────────────────────────────────────────────────────────────

function PayoutsView() {
  const { state, actions } = usePortal();
  const pt = useMemo(() => payoutTotals(state.respondents, state.incentives), [state.respondents, state.incentives]);
  const ready = useMemo(
    () => state.respondents.filter((r) => r.verified && r.payStatus === "Pending"),
    [state.respondents],
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Tokens pending" value={peso(pt.tokensPending)} color="#D97706" />
        <StatCard label="Bonuses pending" value={peso(pt.bonusPending)} color="#7C3AED" />
        <StatCard label="Total paid out" value={peso(pt.paidTotal)} color="#15803D" />
        <StatCard label="On hold" value={pt.onHold} />
      </div>

      <div className="rounded-2xl border border-line bg-white overflow-hidden">
        <div className="border-b border-[#F2F2F4] px-5 py-3.5 text-[13px] font-bold text-brand-ink">
          Ready for payout ({ready.length})
        </div>
        {ready.length === 0 ? (
          <div className="py-12 text-center text-[13.5px] text-gray-400">No pending payouts.</div>
        ) : (
          ready.map((r) => (
            <div key={r.id} className="flex items-center gap-3 border-b border-[#F5F5F7] px-5 py-3.5 last:border-0">
              <div
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[12px] font-extrabold text-white"
                style={{ background: avatarColor(r.name) }}
              >
                {initials(r.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold">{r.name}</div>
                <div className="text-[12px] text-gray-400">{r.method} · {r.acct}</div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-bold text-brand-ink">{peso(tok(state.incentives, r.type))}</div>
                <div className="text-[11.5px] text-gray-400">{typeShort(r.type)}</div>
              </div>
              {state.role !== "stakeholder" && (
                <button
                  onClick={() => actions.markPaid(r.id)}
                  className="flex-none rounded-[9px] bg-green-600 px-3.5 py-2 text-[12.5px] font-bold text-white hover:bg-green-700"
                >
                  Mark paid
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Paid history */}
      <div className="rounded-2xl border border-line bg-white overflow-hidden">
        <div className="border-b border-[#F2F2F4] px-5 py-3.5 text-[13px] font-bold text-brand-ink">
          Paid
        </div>
        {state.respondents.filter((r) => r.payStatus === "Paid").length === 0 ? (
          <div className="py-10 text-center text-[13.5px] text-gray-400">No paid disbursements yet.</div>
        ) : (
          state.respondents.filter((r) => r.payStatus === "Paid").map((r) => (
            <div key={r.id} className="flex items-center gap-3 border-b border-[#F5F5F7] px-5 py-3.5 last:border-0">
              <div
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[12px] font-extrabold text-white"
                style={{ background: avatarColor(r.name) }}
              >
                {initials(r.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold">{r.name}</div>
                <div className="text-[12px] text-gray-400">{r.method} · {r.acct}</div>
              </div>
              <span className={payPillClass("Paid")}>Paid</span>
              <div className="text-right text-[13px] font-bold">{peso(tok(state.incentives, r.type))}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Referrals ────────────────────────────────────────────────────────────────

function ReferralsView() {
  const { state, actions } = usePortal();
  const tiles = useMemo(() => refTiles(state.respondents, state.incentives), [state.respondents, state.incentives]);
  const refs = useMemo(
    () => referrers(state.respondents, state.manualReferrers, state.incentives, codeOf, hash, initials),
    [state.respondents, state.manualReferrers, state.incentives],
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map((t) => (
          <StatCard key={t.label} label={t.label} value={t.value} />
        ))}
      </div>

      {/* Add referrer */}
      {state.role !== "stakeholder" && (
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[13px] font-bold text-brand-ink">Manual referrers</div>
            <button
              onClick={() => actions.setShowAddRef(!state.showAddRef)}
              className="rounded-[9px] border border-line bg-surface px-3 py-1.5 text-[12.5px] font-semibold text-gray-600"
            >
              + Add referrer
            </button>
          </div>
          {state.showAddRef && (
            <div className="mb-4 flex flex-wrap gap-2 rounded-[11px] border border-brand-pinkLine bg-brand-pinkSoft2 p-4">
              <input
                value={state.newRefName}
                onChange={(e) => actions.setNewRefName(e.target.value)}
                placeholder="Referrer name"
                className="h-9 flex-1 min-w-[160px] rounded-[9px] border border-line bg-white px-3 text-[13px] focus:outline-none focus:border-brand-pink"
              />
              <select
                value={state.newRefKind}
                onChange={(e) => actions.setNewRefKind(e.target.value)}
                className="h-9 rounded-[9px] border border-line bg-white px-3 text-[13px] focus:outline-none"
              >
                {["Partner / TSI", "LGU", "Media", "Other"].map((k) => <option key={k}>{k}</option>)}
              </select>
              <button onClick={actions.addReferrer} className="h-9 rounded-[9px] bg-brand-ink px-4 text-[13px] font-bold text-white">
                Add
              </button>
            </div>
          )}
          <div className="space-y-2">
            {refs.map((r) => (
              <div key={r.name} className="flex items-center gap-3 rounded-[10px] border border-[#F2F2F4] p-3">
                <div
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[12px] font-extrabold text-white"
                  style={{ background: r.avatarBg }}
                >
                  {r.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold">{r.name}</div>
                  <div className="text-[11.5px] text-gray-400">{r.kind} · {r.code}</div>
                </div>
                <div className="text-right text-[12.5px]">
                  <div className="font-bold text-brand-ink">{r.referred} referred · {r.verified} verified</div>
                  <div className="text-gray-400">{r.convLabel} · {r.bonusLabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Enumerators ──────────────────────────────────────────────────────────────

function EnumeratorsView() {
  const { state, actions } = usePortal();
  const cards = useMemo(
    () => enumCards(state.enumerators, state.respondents, initials),
    [state.enumerators, state.respondents],
  );

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        {state.role === "admin" && (
          <button
            onClick={() => actions.setShowAddEnum(!state.showAddEnum)}
            className="rounded-[9px] bg-brand-ink px-4 py-2 text-[13px] font-bold text-white"
          >
            + Add enumerator
          </button>
        )}
      </div>

      {state.showAddEnum && (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-brand-pinkLine bg-brand-pinkSoft2 p-5">
          <input
            value={state.newEnumName}
            onChange={(e) => actions.setNewEnumName(e.target.value)}
            placeholder="Full name"
            className="h-10 flex-1 min-w-[160px] rounded-[9px] border border-line bg-white px-3.5 text-[13px] focus:border-brand-pink focus:outline-none"
          />
          <input
            value={state.newEnumEmail}
            onChange={(e) => actions.setNewEnumEmail(e.target.value)}
            placeholder="Email address"
            type="email"
            className="h-10 flex-1 min-w-[200px] rounded-[9px] border border-line bg-white px-3.5 text-[13px] focus:border-brand-pink focus:outline-none"
          />
          <button onClick={actions.addEnumerator} className="h-10 rounded-[9px] bg-brand-ink px-5 text-[13px] font-bold text-white">
            Add
          </button>
          <button onClick={() => actions.setShowAddEnum(false)} className="h-10 rounded-[9px] border border-line bg-white px-4 text-[13px] text-gray-500">
            Cancel
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((e, i) => (
          <div key={e.name} className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 flex items-center gap-3">
              <div
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-[13px] font-extrabold text-white"
                style={{ background: e.avatarBg }}
              >
                {e.initials}
              </div>
              <div className="flex-1">
                <input
                  value={e.name}
                  onChange={(ev) => actions.renameEnumerator(i, ev.target.value)}
                  className="block w-full text-[14px] font-bold text-brand-ink outline-none"
                />
                <input
                  value={e.email}
                  onChange={(ev) => actions.setEnumEmail(i, ev.target.value)}
                  type="email"
                  placeholder="email@example.com"
                  className="block w-full text-[12px] text-gray-400 outline-none"
                />
              </div>
              {state.role === "admin" && (
                <button
                  onClick={() => actions.removeEnumerator(i)}
                  className="flex-none text-gray-300 hover:text-red-400"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
                  </svg>
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-[10px] bg-surface p-3 text-center">
              <div>
                <div className="text-[18px] font-extrabold text-brand-ink">{e.assigned}</div>
                <div className="text-[11px] text-gray-400">Assigned</div>
              </div>
              <div>
                <div className="text-[18px] font-extrabold text-green-700">{e.completed}</div>
                <div className="text-[11px] text-gray-400">Completed</div>
              </div>
              <div>
                <div className="text-[18px] font-extrabold text-brand-ink">{e.rate}%</div>
                <div className="text-[11px] text-gray-400">Rate</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reports ─────────────────────────────────────────────────────────────────

const REPORT_DEFS = [
  { name: "All respondents", desc: "Full respondent list with status and payout details.", fmts: ["CSV", "XLSX"] },
  { name: "Verified respondents", desc: "Verified submissions only — for payout processing.", fmts: ["CSV", "XLSX"] },
  { name: "QA summary", desc: "Pending, follow-up, rejected, and verified counts.", fmts: ["CSV", "PDF"] },
  { name: "Payout manifest", desc: "Account details for all approved disbursements.", fmts: ["CSV", "XLSX"] },
  { name: "Referral report", desc: "Referrer performance and bonus totals.", fmts: ["CSV"] },
  { name: "Audit trail", desc: "Complete audit log for compliance review.", fmts: ["CSV", "PDF"] },
];

function ReportsView() {
  const { actions } = usePortal();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {REPORT_DEFS.map((r) => (
        <div key={r.name} className="rounded-2xl border border-line bg-white p-5">
          <div className="mb-1 text-[14px] font-bold text-brand-ink">{r.name}</div>
          <p className="mb-4 text-[12.5px] leading-[1.5] text-gray-500">{r.desc}</p>
          <div className="flex gap-2">
            {r.fmts.map((fmt) => (
              <button
                key={fmt}
                onClick={() => actions.doExport(r.name, fmt)}
                className="rounded-[9px] border border-line bg-surface px-4 py-2 text-[12.5px] font-semibold text-gray-600 hover:bg-white hover:border-brand-pinkLine"
              >
                Export {fmt}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Emails ──────────────────────────────────────────────────────────────────

function EmailsView() {
  const { state, actions } = usePortal();
  const defs = useMemo(() => emailDefs(), []);
  const sel = defs.find((d) => d.id === state.emailSel) ?? defs[0];

  return (
    <div className="flex gap-5 flex-col lg:flex-row">
      {/* Sidebar list */}
      <div className="flex-none lg:w-[220px] space-y-1">
        {defs.map((d) => (
          <button
            key={d.id}
            onClick={() => actions.setEmail(d.id)}
            className={cx(
              "w-full rounded-[10px] p-3 text-left",
              state.emailSel === d.id ? "bg-brand-pinkSoft border border-brand-pinkLine" : "hover:bg-surface",
            )}
          >
            <div className={cx("text-[12.5px] font-bold", state.emailSel === d.id ? "text-[#9D174D]" : "text-brand-ink")}>
              {d.name}
            </div>
            <div className="text-[11px] text-gray-400">{d.audience}</div>
          </button>
        ))}
      </div>

      {/* Preview */}
      {sel && (
        <div className="flex-1 min-w-0 rounded-2xl border border-line bg-white overflow-hidden">
          <div className="border-b border-[#F2F2F4] px-6 py-4">
            <div className="text-[14px] font-bold text-brand-ink">{sel.name}</div>
            <div className="mt-1 text-[12px] text-gray-400">
              <span className="font-semibold">Subject:</span> {sel.subject}
            </div>
            <div className="text-[12px] text-gray-400">
              <span className="font-semibold">From:</span> {sel.from}
            </div>
          </div>
          <div className="p-6 space-y-4 max-w-[560px]">
            {sel.blocks.map((b, i) => {
              if (b.type === "h") return <h2 key={i} className="text-[20px] font-extrabold text-brand-ink">{b.text}</h2>;
              if (b.type === "p") return <p key={i} className="text-[13.5px] leading-[1.65] text-gray-600">{b.text}</p>;
              if (b.type === "code") return (
                <div key={i} className="flex items-center justify-center rounded-[11px] border border-brand-pinkLine bg-brand-pinkSoft py-4">
                  <span className="font-mono text-[32px] font-extrabold tracking-[8px] text-[#9D174D]">{b.text}</span>
                </div>
              );
              if (b.type === "note") return <p key={i} className="rounded-[9px] bg-surface px-4 py-3 text-[12px] leading-[1.6] text-gray-500">{b.text}</p>;
              if (b.type === "btn") return (
                <div key={i}>
                  <button className="rounded-[10px] px-6 py-3 text-[13.5px] font-bold text-white" style={{ background: sel.accent }}>{b.text}</button>
                </div>
              );
              if (b.type === "kv" && b.rows) return (
                <div key={i} className="rounded-[10px] border border-[#F2F2F4] overflow-hidden">
                  {b.rows.map(([k, v]) => (
                    <div key={k} className="flex border-b border-[#F5F5F7] px-4 py-2.5 last:border-0 text-[12.5px]">
                      <span className="flex-none w-[120px] font-semibold text-gray-400">{k}</span>
                      <span className="text-gray-700">{v}</span>
                    </div>
                  ))}
                </div>
              );
              if (b.type === "divider") return <hr key={i} className="border-[#F2F2F4]" />;
              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Audit log ───────────────────────────────────────────────────────────────

function AuditView() {
  const { state } = usePortal();
  return (
    <div className="rounded-2xl border border-line bg-white overflow-hidden">
      {state.audit.length === 0 ? (
        <div className="py-14 text-center text-[13.5px] text-gray-400">No audit entries yet.</div>
      ) : (
        state.audit.map((entry, i) => (
          <div key={i} className="flex items-start gap-3 border-b border-[#F5F5F7] px-5 py-3.5 last:border-0">
            <div
              className="mt-[2px] flex h-7 w-7 flex-none items-center justify-center rounded-full text-[11px] font-bold"
              style={{ background: entry[4], color: entry[5] }}
            >
              ·
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-gray-700">
                {entry[0]} <span className="text-gray-400">{entry[1]}</span>
              </div>
              <div className="text-[11.5px] text-gray-400">by {entry[2]} · {entry[3]}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────

function SettingsView() {
  const { state, actions } = usePortal();
  const types = ["TSI", "AgriTech", "SME"] as const;

  return (
    <div className="space-y-5 max-w-[700px]">
      {/* Targets */}
      <div className="rounded-2xl border border-line bg-white p-6">
        <div className="mb-4 text-[14px] font-bold text-brand-ink">Respondent targets</div>
        <div className="grid gap-4 sm:grid-cols-3">
          {types.map((t) => (
            <label key={t} className="block">
              <span className="mb-1.5 block text-[12px] font-bold text-gray-500">{typeShort(t)}</span>
              <input
                type="number"
                min={0}
                value={state.draftTargets[t]}
                onChange={(e) => actions.setTarget(t, e.target.value)}
                className="h-10 w-full rounded-[9px] border border-line bg-surface px-3 text-[14px] font-semibold focus:border-brand-pink focus:outline-none"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Incentives */}
      <div className="rounded-2xl border border-line bg-white p-6">
        <div className="mb-4 text-[14px] font-bold text-brand-ink">Incentive amounts (₱)</div>
        <div className="space-y-4">
          {types.map((t) => (
            <div key={t}>
              <div className="mb-2 text-[12.5px] font-bold text-gray-600">{typeShort(t)}</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[11.5px] font-semibold text-gray-400">Token</span>
                  <input
                    type="number"
                    min={0}
                    value={state.draftIncentives[t].token}
                    onChange={(e) => actions.setIncentive(t, "token", e.target.value)}
                    className="h-10 w-full rounded-[9px] border border-line bg-surface px-3 text-[14px] font-semibold focus:border-brand-pink focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11.5px] font-semibold text-gray-400">Referral bonus</span>
                  <input
                    type="number"
                    min={0}
                    value={state.draftIncentives[t].bonus}
                    onChange={(e) => actions.setIncentive(t, "bonus", e.target.value)}
                    className="h-10 w-full rounded-[9px] border border-line bg-surface px-3 text-[14px] font-semibold focus:border-brand-pink focus:outline-none"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save / discard */}
      {state.role === "admin" && (
        <div className="flex gap-3">
          <button
            onClick={actions.askSaveSettings}
            className="rounded-[10px] bg-brand-ink px-6 py-2.5 text-[13.5px] font-bold text-white"
          >
            Save settings
          </button>
          <button
            onClick={actions.discardSettings}
            className="rounded-[10px] border border-line bg-white px-6 py-2.5 text-[13.5px] font-semibold text-gray-600"
          >
            Discard changes
          </button>
        </div>
      )}

      {/* Confirm dialog */}
      {state.confirmSave && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-5">
          <div className="w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-2 text-[17px] font-extrabold">Save settings?</h2>
            <p className="mb-5 text-[13px] text-gray-500">
              This will update targets and incentive amounts for all future respondents.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={actions.cancelSaveSettings}
                className="flex-1 rounded-[10px] border border-line py-2.5 text-[13.5px] font-semibold text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={actions.confirmSaveSettings}
                className="flex-1 rounded-[10px] bg-brand-ink py-2.5 text-[13.5px] font-bold text-white"
              >
                Confirm save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Profile drawer ───────────────────────────────────────────────────────────

function ProfileDrawer() {
  const { state, actions } = usePortal();
  const r = state.respondents.find((x) => x.id === state.selectedId);
  if (!r) return null;

  const bonusAmt = r.verified && r.referred ? bon(state.incentives, r.type) : 0;

  const kv = (label: string, value: React.ReactNode) => (
    <div className="flex items-start justify-between gap-3 border-b border-[#F5F5F7] py-2.5 last:border-0">
      <span className="flex-none text-[12.5px] font-semibold text-gray-400">{label}</span>
      <span className="text-right text-[12.5px] font-semibold text-brand-ink">{value}</span>
    </div>
  );

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={actions.closeProfile}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col border-l border-line bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <div
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-[14px] font-extrabold text-white"
            style={{ background: avatarColor(r.name) }}
          >
            {initials(r.name)}
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-extrabold text-brand-ink">{r.name}</div>
            <div className="flex items-center gap-2">
              <span className={typePillClass(r.type)}>{typeShort(r.type)}</span>
              <span className={statusPillClass(r.status)}>{r.status}</span>
            </div>
          </div>
          <button onClick={actions.closeProfile} className="text-gray-400 hover:text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Basic info */}
          <div className="mb-4 rounded-[12px] border border-line p-4">
            {kv("Email", r.email)}
            {kv("Mobile", r.mobile || "—")}
            {kv("Organization", r.org)}
            {kv("Position", r.position || "—")}
            {kv("Region", r.region || "—")}
            {kv("Mode", r.mode)}
            {kv("Enumerator", r.enumerator || "—")}
            {kv("Referral code", <span className="font-mono">{r.code || "—"}</span>)}
          </div>

          {/* QA + payout */}
          <div className="mb-4 rounded-[12px] border border-line p-4">
            {kv("Selfie", r.selfie ? "✓ Submitted" : "Not yet")}
            {kv("Payout method", r.method)}
            {kv("Account", r.acct !== "—" ? r.acct : "—")}
            {kv("Pay status", <span className={payPillClass(r.payStatus)}>{r.payStatus}</span>)}
            {kv("Token", peso(tok(state.incentives, r.type)))}
            {bonusAmt > 0 && kv("Referral bonus", peso(bonusAmt))}
            {r.referred && kv("Referred by", r.referrer ?? "—")}
          </div>

          {/* Flags */}
          {r.flags && r.flags.length > 0 && (
            <div className="mb-4 rounded-[12px] border border-red-200 bg-red-50 p-4">
              <div className="mb-2 text-[12px] font-bold uppercase tracking-[.4px] text-red-700">Flags</div>
              {r.flags.map((f) => (
                <div key={f} className="text-[12.5px] text-red-600">🚩 {f}</div>
              ))}
            </div>
          )}
        </div>

        {/* QA actions */}
        {state.role !== "stakeholder" && (r.status === "Pending QA" || r.status === "Needs Follow-up") && (
          <div className="border-t border-line p-4">
            <div className="mb-2 text-[11.5px] font-bold uppercase tracking-[.4px] text-gray-400">QA actions</div>
            <div className="flex gap-2">
              <button
                onClick={() => actions.qaAct(r.id, "approve")}
                className="flex-1 rounded-[9px] bg-green-600 py-2.5 text-[13px] font-bold text-white hover:bg-green-700"
              >
                ✓ Approve
              </button>
              <button
                onClick={() => actions.qaAct(r.id, "follow")}
                className="flex-1 rounded-[9px] bg-amber-500 py-2.5 text-[13px] font-bold text-white hover:bg-amber-600"
              >
                ⚑ Follow-up
              </button>
              <button
                onClick={() => actions.qaAct(r.id, "reject")}
                className="flex-1 rounded-[9px] bg-red-500 py-2.5 text-[13px] font-bold text-white hover:bg-red-600"
              >
                ✕ Reject
              </button>
            </div>
          </div>
        )}

        {state.role !== "stakeholder" && r.verified && r.payStatus === "Pending" && (
          <div className="border-t border-line p-4">
            <button
              onClick={() => actions.markPaid(r.id)}
              className="w-full rounded-[10px] bg-green-600 py-3 text-[13.5px] font-bold text-white hover:bg-green-700"
            >
              Mark as paid · {peso(tok(state.incentives, r.type))}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
