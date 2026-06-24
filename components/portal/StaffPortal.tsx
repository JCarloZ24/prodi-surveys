"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { usePortal, USER_NAMES, PortalProvider } from "@/lib/store";
import {
  counts,
  enumCards,
  filteredRows,
  funnel,
  funnelDetail,
  groups,
  groupBreakdown,
  payoutTotals,
  refTiles,
  tok,
  bon,
  totals,
} from "@/lib/selectors";
import { aggregateResponses } from "@/lib/responses";
import {
  avatarColor,
  initials,
  peso,
} from "@/lib/format";
import { emailDefs } from "@/lib/emails";
import { cx } from "@/lib/cx";
import { LogoMark } from "@/lib/icons";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { allowedViews, isViewAllowed } from "@/lib/portal-views";
import { ReferrersView } from "@/components/portal/ReferrersView";
import type { Respondent, RespondentType, Role, ViewKey } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeBadge(t: string) {
  const map: Record<string, string> = {
    TSI:      "rounded-md px-2 py-0.5 text-[11.5px] font-bold bg-violet-100 text-violet-700",
    AgriTech: "rounded-md px-2 py-0.5 text-[11.5px] font-bold bg-emerald-100 text-emerald-700",
    SME:      "rounded-md px-2 py-0.5 text-[11.5px] font-bold bg-rose-100 text-rose-700",
  };
  const label: Record<string, string> = { TSI: "TSI", AgriTech: "Agri-Tech", SME: "SME" };
  return <span className={map[t] ?? "rounded-md px-2 py-0.5 text-[11.5px] font-bold bg-gray-100 text-gray-600"}>{label[t] ?? t}</span>;
}

function statusBadge(s: string) {
  const colors: Record<string, string> = {
    "Verified":           "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Pending QA":         "bg-amber-50 text-amber-700 border-amber-200",
    "Needs Follow-up":    "bg-orange-50 text-orange-700 border-orange-200",
    "Rejected":           "bg-red-50 text-red-700 border-red-200",
    "Email Verified":     "bg-blue-50 text-blue-700 border-blue-200",
    "Survey Completed":   "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Selfie Submitted":   "bg-purple-50 text-purple-700 border-purple-200",
    "New":                "bg-gray-50 text-gray-500 border-gray-200",
  };
  return (
    <span className={cx("rounded-md border px-2 py-0.5 text-[11.5px] font-semibold", colors[s] ?? "bg-gray-50 text-gray-600 border-gray-200")}>
      {s}
    </span>
  );
}

function payBadge(s: string) {
  const colors: Record<string, string> = {
    Paid:     "bg-emerald-50 text-emerald-700 border-emerald-200",
    Approved: "bg-blue-50 text-blue-700 border-blue-200",
    Pending:  "bg-amber-50 text-amber-700 border-amber-200",
    "On Hold":"bg-gray-50 text-gray-600 border-gray-200",
    Failed:   "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={cx("rounded-md border px-2 py-0.5 text-[11.5px] font-semibold", colors[s] ?? "bg-gray-50 text-gray-600 border-gray-200")}>
      {s}
    </span>
  );
}

function tokenDisplay(type: string, incentives: { TSI: { token: number }; AgriTech: { token: number }; SME: { token: number } }) {
  if (type === "TSI") return <span className="font-semibold text-[13px] text-gray-700">Tumbler</span>;
  const amt = tok(incentives as Parameters<typeof tok>[0], type as Parameters<typeof tok>[1]);
  return <span className="font-semibold text-[13px] text-[#18181B]">{peso(amt)}</span>;
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV: { key: ViewKey; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard",   label: "Dashboard",    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { key: "respondents", label: "Respondents",  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { key: "qa",          label: "QA Review",    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  { key: "payouts",     label: "Payouts",      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
  { key: "enumerators", label: "Enumerators",  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { key: "stakeholders", label: "Stakeholders", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
  { key: "referrers",   label: "Referrers",    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> },
  { key: "reports",     label: "Reports / Export", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { key: "emails",      label: "Emails",        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
  { key: "audit",       label: "Audit Logs",    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="10" y1="17" x2="8" y2="17"/></svg> },
  { key: "settings",    label: "Settings",      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
];

const roleLabel: Record<string, string> = {
  admin: "Super Admin",
  enumerator: "Enumerator",
  stakeholder: "Stakeholder",
};

// ─── Shell ─────────────────────────────────────────────────────────────────────

// Persistent portal chrome (sidebar + header + drawer). Rendered by the role
// layout; the active page is provided as `children` by the routed `[view]` page.
export function PortalShell({
  role,
  initialRespondents,
  userName,
  children,
}: {
  role: Role;
  initialRespondents: Respondent[];
  userName?: string;
  children: React.ReactNode;
}) {
  return (
    <PortalProvider initialMode="portal" initialRole={role} initialRespondents={initialRespondents} initialUserName={userName}>
      <PortalChrome role={role}>{children}</PortalChrome>
    </PortalProvider>
  );
}

// Switch a view key to its component. Rendered by app/portal/[role]/[view]/page.
export function PortalView({ view }: { view: ViewKey }) {
  switch (view) {
    case "respondents":  return <RespondentsView />;
    case "qa":           return <QaView />;
    case "payouts":      return <PayoutsView />;
    case "enumerators":  return <EnumeratorsView />;
    case "stakeholders": return <StakeholdersView />;
    case "referrers":    return <ReferrersView />;
    case "reports":      return <ReportsView />;
    case "emails":       return <EmailsView />;
    case "audit":        return <AuditView />;
    case "settings":     return <SettingsView />;
    case "dashboard":
    default:             return <Dashboard />;
  }
}

// Navigate to another view under the current role's URL space. An optional hash
// lets callers deep-link to a sub-tab (e.g. a specific report on the Reports page).
function useGoView() {
  const router = useRouter();
  const { state } = usePortal();
  return (view: ViewKey, hash?: string) =>
    router.push(`/portal/${state.role}/${view}${hash ? `#${hash}` : ""}`);
}

function PortalChrome({ role, children }: { role: Role; children: React.ReactNode }) {
  const { state, actions } = usePortal();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [surveyHref, setSurveyHref] = useState("https://www.prodigitalitydata.live");
  useEffect(() => {
    if (window.location.hostname === "localhost") setSurveyHref(window.location.origin);
  }, []);

  const handleLogout = async () => {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/portal/login");
    router.refresh();
  };

  const activeView  = pathname.split("/").filter(Boolean).pop();
  const userName    = state.userName || USER_NAMES[role];
  const userInits   = initials(userName);
  const userColor   = avatarColor(userName);
  const pendingQa   = state.respondents.filter((r) => r.status === "Pending QA" || r.status === "Needs Follow-up").length;
  const c           = useMemo(() => counts(state.respondents), [state.respondents]);
  const { totalTarget, overallPct } = useMemo(() => totals(state.targets, c.verified), [state.targets, c.verified]);

  const allowed  = allowedViews(role);
  const navItems = NAV.filter((n) => allowed.includes(n.key));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F7F7F8" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col lg:static lg:translate-x-0 transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ background: "linear-gradient(180deg, #1A0F3D 0%, #2E1357 100%)" }}
      >
        {/* Logo */}
        <div className="flex h-[64px] flex-none items-center gap-2.5 px-5">
          <LogoMark size={26} />
          <div>
            <div className="text-[14px] font-extrabold tracking-[-0.3px] text-white/90 leading-tight">
              Prodi-Surveys
            </div>
            <div className="text-[10.5px] text-white/40 leading-tight">Survey Operations</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[1px] text-white/30">
            Menu
          </div>
          {navItems.map((item) => {
            const active = activeView === item.key;
            const badge  = item.key === "qa" && pendingQa > 0 ? pendingQa : 0;
            return (
              <Link
                key={item.key}
                href={`/portal/${role}/${item.key}`}
                onClick={() => setSidebarOpen(false)}
                className={cx(
                  "flex w-full items-center gap-3 rounded-[9px] px-3 py-[9px] text-[12.5px] font-semibold transition-colors",
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/50 hover:bg-white/8 hover:text-white/80",
                )}
              >
                <span className="flex-none opacity-90">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {badge > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#E0195F] px-1 text-[10.5px] font-extrabold text-white">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Progress bar */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-2 flex items-center justify-between text-[11px] text-white/40">
            <span className="font-semibold">Verified progress</span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-[20px] font-extrabold text-white leading-none">{c.verified}</span>
            <span className="text-[13px] text-white/40 mb-0.5">/{totalTarget}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, overallPct)}%`, background: "#E0195F" }}
            />
          </div>
          <div className="mt-1.5 text-[11px] text-white/35">{overallPct}% of target</div>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-[64px] flex-none items-center gap-3 border-b border-[#E4E4E7] bg-white px-4 sm:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex-none text-gray-400 lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Global search */}
          <div className="relative flex-1 max-w-[380px] hidden sm:block">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={state.search}
              onChange={(e) => actions.setSearch(e.target.value)}
              placeholder="Search respondents, orgs, referral codes..."
              className="h-9 w-full rounded-[9px] border border-[#E4E4E7] bg-[#F7F7F8] pl-9 pr-3.5 text-[12.5px] focus:border-[#18181B] focus:bg-white focus:outline-none"
            />
          </div>
          <div className="flex-1" />

          {/* Respondent flow button */}
          {role !== "stakeholder" && (
            <a
              href={surveyHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-[9px] border border-[#E4E4E7] px-3.5 py-2 text-[12.5px] font-semibold text-gray-600 hover:border-gray-300 hover:bg-[#F7F7F8]"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Respondent flow
            </a>
          )}

          {/* User info + signout */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[11.5px] font-extrabold text-white"
              style={{ background: userColor }}
            >
              {userInits}
            </div>
            <div className="hidden md:block">
              <div className="text-[12.5px] font-bold text-[#18181B] leading-tight">{userName}</div>
              <div className="text-[11px] text-gray-400 leading-tight">{roleLabel[role]}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex-none text-gray-400 hover:text-gray-600 ml-1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </header>

        {/* View content (provided by the routed page) */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Profile drawer */}
      {state.selectedId != null && <ProfileDrawer />}

      {/* Toast */}
      {state.toast && (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-[11px] bg-[#18181B] px-5 py-3 text-[13px] font-semibold text-white shadow-xl">
          {state.toast}
        </div>
      )}
    </div>
  );
}

// ─── Page header ───────────────────────────────────────────────────────────────

function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#18181B]">{title}</h1>
        {sub && <p className="mt-0.5 text-[13px] text-gray-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, dark }: {
  label: string; value: React.ReactNode; sub?: string; color?: string; dark?: boolean
}) {
  if (dark) {
    return (
      <div className="rounded-2xl p-5" style={{ background: "#1A0F3D" }}>
        <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.4px] text-white/40">{label}</div>
        <div className="text-[24px] font-extrabold tracking-[-0.5px] text-white" style={{ color: color || "white" }}>
          {value}
        </div>
        {sub && <div className="mt-1 text-[11.5px] text-white/35">{sub}</div>}
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-[#E4E4E7] bg-white p-5">
      <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.4px] text-gray-400">{label}</div>
      <div className="text-[24px] font-extrabold tracking-[-0.5px]" style={{ color: color || "#18181B" }}>
        {value}
      </div>
      {sub && <div className="mt-1 text-[11.5px] text-gray-400">{sub}</div>}
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard() {
  const { state } = usePortal();
  const go = useGoView();
  const c = useMemo(() => counts(state.respondents), [state.respondents]);
  const grps = useMemo(() => groups(state.respondents, state.targets), [state.respondents, state.targets]);
  const { totalTarget, remaining } = useMemo(() => totals(state.targets, c.verified), [state.targets, c.verified]);
  const funnelSteps = useMemo(() => funnel(state.respondents, c, totalTarget), [state.respondents, c, totalTarget]);
  const pt = useMemo(() => payoutTotals(state.respondents, state.incentives), [state.respondents, state.incentives]);
  const tiles = useMemo(() => {
    const all = refTiles(state.respondents, state.incentives);
    // Stakeholders never see monetary figures — drop the bonus value tile.
    return state.role === "stakeholder" ? all.filter((t) => t.label !== "Pending bonuses") : all;
  }, [state.respondents, state.incentives, state.role]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Operations dashboard"
        sub={`${totalTarget} verified respondents target · mid-project`}
        action={
          state.role !== "enumerator" ? (
            <button className="flex items-center gap-2 rounded-[10px] bg-[#18181B] px-4 py-2.5 text-[12.5px] font-bold text-white">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export report
            </button>
          ) : undefined
        }
      />

      {/* 6-stat row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Registered"    value={c.registered} />
        <StatCard label="Email verified" value={c.emailV} />
        <StatCard label="Survey done"   value={c.surveyDone} />
        <StatCard label="Selfie"        value={c.selfieN} />
        <StatCard label="Verified"      value={<>{c.verified}<span className="text-[14px] text-gray-400">/{totalTarget}</span></>} color="#15803D" />
        <StatCard label="Remaining"     value={remaining} sub="to target" color="#E0195F" />
      </div>

      {/* Progress by respondent group */}
      <div className="rounded-2xl border border-[#E4E4E7] bg-white p-5">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[13.5px] font-bold text-[#18181B]">Progress by respondent group</span>
          {isViewAllowed(state.role, "reports") ? (
            <button onClick={() => go("reports", "groups")} className="text-[11.5px] font-semibold text-[#E0195F] hover:underline">
              View detailed report →
            </button>
          ) : (
            <span className="text-[11.5px] text-gray-400">Verified vs target</span>
          )}
        </div>
        <div className="mt-4 grid gap-6 sm:grid-cols-3">
          {grps.map((g) => (
            <div key={g.label}>
              <div className="mb-1.5 flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full flex-none" style={{ background: g.color }} />
                  <span className="font-semibold text-gray-700">{g.label}</span>
                </div>
                <span className="font-bold" style={{ color: g.color }}>{g.verified}/{g.target}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#EFEFF1]">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, g.pct)}%`, background: g.color }} />
              </div>
              <div className="mt-1.5 flex gap-3 text-[11px] text-gray-400">
                <span>{g.pendingQa} in QA</span>
                <span>{g.inProgress} in progress</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel + QA side by side (QA hidden for stakeholders) */}
      <div className={cx("grid gap-4", state.role !== "stakeholder" && "lg:grid-cols-2")}>
        {/* Verification funnel */}
        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[13.5px] font-bold text-[#18181B]">Verification funnel</span>
            {isViewAllowed(state.role, "reports") && (
              <button onClick={() => go("reports", "funnel")} className="text-[11.5px] font-semibold text-[#E0195F] hover:underline">
                View detailed report →
              </button>
            )}
          </div>
          <div className="space-y-2.5">
            {funnelSteps.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-[130px] flex-none text-[11.5px] font-semibold text-gray-500">{s.label}</div>
                <div className="flex-1 overflow-hidden rounded-full bg-[#F0F0F2]" style={{ height: 7 }}>
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: "linear-gradient(90deg, #E0195F 0%, #F97316 100%)" }} />
                </div>
                <div className="w-8 flex-none text-right text-[12px] font-bold text-gray-700">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* QA review — hidden for stakeholders */}
        {state.role !== "stakeholder" && (
        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[13.5px] font-bold text-[#18181B]">QA review</span>
            <button onClick={() => go("qa")} className="text-[12px] font-semibold text-[#E0195F] hover:underline">
              Open queue →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[12px] bg-amber-50 p-4">
              <div className="text-[24px] font-extrabold text-amber-700">{c.pendingQa}</div>
              <div className="mt-0.5 text-[12px] text-amber-600">Pending review</div>
            </div>
            <div className="rounded-[12px] bg-emerald-50 p-4">
              <div className="text-[24px] font-extrabold text-emerald-700">{c.verified}</div>
              <div className="mt-0.5 text-[12px] text-emerald-600">Verified</div>
            </div>
            <div className="rounded-[12px] bg-orange-50 p-4">
              <div className="text-[24px] font-extrabold text-orange-700">{c.followup}</div>
              <div className="mt-0.5 text-[12px] text-orange-600">Needs follow-up</div>
            </div>
            <div className="rounded-[12px] bg-red-50 p-4">
              <div className="text-[24px] font-extrabold text-red-700">{c.flagged}</div>
              <div className="mt-0.5 text-[12px] text-red-600">Flagged</div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Referrals + Payouts — hidden entirely for stakeholders */}
      {state.role !== "stakeholder" && (
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Referrals */}
        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[13.5px] font-bold text-[#18181B]">Referrals</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {tiles.map((t) => (
              <div key={t.label} className="rounded-[12px] bg-[#F7F7F8] p-4">
                <div className="text-[22px] font-extrabold text-[#18181B]">{t.value}</div>
                <div className="mt-0.5 text-[11.5px] text-gray-500">{t.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Payouts — admin only */}
        {state.role === "admin" && (
          <div className="rounded-2xl p-5" style={{ background: "#1A0F3D" }}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-bold text-white">Payouts</span>
                <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/60" style={{ background: "rgba(255,255,255,0.1)" }}>
                  ADMIN
                </span>
              </div>
              <button onClick={() => go("payouts")} className="text-[12px] font-semibold text-white/50 hover:text-white/80">
                Manage →
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[12px] p-4" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="text-[22px] font-extrabold text-white">{peso(pt.tokensPending)}</div>
                <div className="mt-0.5 text-[11.5px] text-white/45">Tokens pending</div>
              </div>
              <div className="rounded-[12px] p-4" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="text-[22px] font-extrabold text-white">{peso(pt.bonusPending)}</div>
                <div className="mt-0.5 text-[11.5px] text-white/45">Bonuses pending</div>
              </div>
              <div className="rounded-[12px] p-4" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="text-[22px] font-extrabold text-white">{peso(pt.paidTotal)}</div>
                <div className="mt-0.5 text-[11.5px] text-white/45">Paid out</div>
              </div>
              <div className="rounded-[12px] p-4" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="text-[22px] font-extrabold text-white">{pt.onHold}</div>
                <div className="mt-0.5 text-[11.5px] text-white/45">On hold</div>
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}

// ─── Respondents ──────────────────────────────────────────────────────────────

function RespondentsView() {
  const { state, actions } = usePortal();
  // Stakeholders never see monetary columns (token amount / payout status).
  const showMoney = state.role !== "stakeholder";
  const rows = useMemo(
    () => filteredRows(state.respondents, state.role, {
      filterType:   state.filterType,
      filterStatus: state.filterStatus,
      flaggedOnly:  state.flaggedOnly,
      search:       state.search,
    }),
    [state.respondents, state.role, state.filterType, state.filterStatus, state.flaggedOnly, state.search],
  );

  const typeOpts   = ["all", "TSI", "AgriTech", "SME"] as const;
  const typeLbl    = { all: "All", TSI: "TSI", AgriTech: "Agri-Tech", SME: "SME" };

  const STATUS_ORDER = [
    "New", "Email Verification Pending", "Email Verified",
    "Survey Started", "Survey Completed", "Selfie Submitted",
    "Pending QA", "Needs Follow-up", "Verified", "Rejected",
  ];
  const statusOpts = useMemo(() => {
    const present = new Set(state.respondents.map((r) => r.status as string));
    return ["all", ...STATUS_ORDER.filter((s) => present.has(s))];
  }, [state.respondents]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Respondents"
        sub={`${rows.length} of ${state.respondents.length} respondents shown`}
        action={
          state.role !== "enumerator" ? (
            <button className="flex items-center gap-1.5 rounded-[9px] border border-[#E4E4E7] bg-white px-3.5 py-2 text-[12.5px] font-semibold text-gray-600 hover:bg-[#F7F7F8]">
              Export CSV
            </button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type tabs */}
        <div className="flex gap-1 rounded-[9px] border border-[#E4E4E7] bg-white p-1">
          {typeOpts.map((t) => (
            <button
              key={t}
              onClick={() => actions.setFilterType(t)}
              className={cx(
                "rounded-[7px] px-3 py-1.5 text-[12px] font-semibold",
                state.filterType === t ? "bg-[#18181B] text-white" : "text-gray-500 hover:text-gray-700",
              )}
            >
              {typeLbl[t]}
            </button>
          ))}
        </div>

        {/* Status dropdown */}
        <select
          value={state.filterStatus}
          onChange={(e) => actions.setFilterStatus(e.target.value)}
          className="h-9 rounded-[9px] border border-[#E4E4E7] bg-white px-3 text-[12.5px] font-semibold text-gray-600 focus:outline-none focus:border-gray-400"
        >
          {statusOpts.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>
          ))}
        </select>

        {/* Flagged only */}
        <label className="flex cursor-pointer items-center gap-2 rounded-[9px] border border-[#E4E4E7] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-gray-600 hover:bg-[#F7F7F8]">
          <input
            type="checkbox"
            checked={state.flaggedOnly}
            onChange={actions.toggleFlagged}
            className="accent-[#E0195F]"
          />
          Flagged only
        </label>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white">
        {rows.length === 0 ? (
          <div className="py-14 text-center text-[13.5px] text-gray-400">No respondents match the current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-[#F2F2F4]">
                  {[
                    "RESPONDENT", "TYPE", "REGION", "MODE", "ENUMERATOR", "REFERRED BY", "PROFILE STATUS",
                    ...(showMoney ? ["PAY STATUS"] : []),
                    "FLAGS",
                    ...(showMoney ? ["TOKEN"] : []),
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.5px] text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => actions.openProfile(r.id)}
                    className="cursor-pointer border-b border-[#F5F5F7] hover:bg-[#FAFAFA] last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[11.5px] font-extrabold text-white" style={{ background: avatarColor(r.name) }}>
                          {initials(r.name)}
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-[#18181B]">{r.name}</div>
                          <div className="text-[11.5px] text-gray-400">{r.org}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{typeBadge(r.type)}</td>
                    <td className="px-4 py-3 text-[12.5px] text-gray-600">{r.region || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cx(
                        "rounded-md px-2 py-0.5 text-[11.5px] font-semibold",
                        r.mode === "Self-service"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-blue-50 text-blue-700",
                      )}>
                        {r.mode === "Self-service" ? "Self-service" : "Enumerator-assisted"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-gray-600">{r.enumerator || "—"}</td>
                    <td className="px-4 py-3 text-[12.5px] text-gray-600">{r.referredBy || "—"}</td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    {showMoney && (
                      <td className="px-4 py-3">
                        {r.verified && r.payStatus && r.payStatus !== "—"
                          ? payBadge(r.payStatus)
                          : <span className="text-gray-300">—</span>}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      {r.flags && r.flags.length > 0 && (
                        <span className="flex items-center gap-1 text-red-500">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                          </svg>
                          <span className="text-[11.5px] font-bold">{r.flags.length}</span>
                        </span>
                      )}
                      {(!r.flags || r.flags.length === 0) && <span className="text-gray-300">—</span>}
                    </td>
                    {showMoney && <td className="px-4 py-3">{tokenDisplay(r.type, state.incentives)}</td>}
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

// ─── QA Review ────────────────────────────────────────────────────────────────

function QaView() {
  const { state, actions } = usePortal();
  const queue = useMemo(
    () => state.respondents.filter((r) => r.status === "Pending QA" || r.status === "Needs Follow-up"),
    [state.respondents],
  );
  const filtered = state.search.trim()
    ? queue.filter((r) =>
        r.name.toLowerCase().includes(state.search.toLowerCase()) ||
        r.org.toLowerCase().includes(state.search.toLowerCase()),
      )
    : queue;

  return (
    <div className="space-y-3">
      <PageHeader
        title="QA Review queue"
        sub={`${filtered.length} submission${filtered.length !== 1 ? "s" : ""} awaiting decision. Flagged items are highlighted.`}
      />

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 py-16 text-center">
          <div className="text-[32px]">✓</div>
          <div className="mt-2 text-[14px] font-bold text-emerald-800">All clear — no pending submissions</div>
        </div>
      ) : (
        filtered.map((r) => {
          const isFlagged = r.flags && r.flags.length > 0;
          const hasUnique = !r.flags.some(f => f.startsWith("Duplicate"));
          return (
            <div
              key={r.id}
              className={cx(
                "rounded-2xl border bg-white p-5",
                isFlagged ? "border-red-200 ring-1 ring-red-200" : "border-[#E4E4E7]",
              )}
            >
              {/* Header row */}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-[13px] font-extrabold text-white" style={{ background: avatarColor(r.name) }}>
                  {initials(r.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-bold text-[#18181B]">{r.name}</span>
                    {typeBadge(r.type)}
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-gray-500">
                    {r.org} · {r.region || "—"} · {r.mode === "Self-service" ? "Self-service" : "Enumerator-assisted"}
                  </div>
                </div>
                <button
                  onClick={() => actions.openProfile(r.id)}
                  className="flex-none rounded-[9px] border border-[#E4E4E7] px-3 py-1.5 text-[12px] font-semibold text-gray-600 hover:bg-[#F7F7F8]"
                >
                  View profile
                </button>
              </div>

              {/* Check items */}
              <div className="mt-3 flex flex-wrap gap-3">
                {[
                  { label: "Email",  ok: r.emailV },
                  { label: "Survey", ok: r.surveyDone },
                  { label: "Selfie", ok: r.selfie },
                  { label: "Unique", ok: hasUnique },
                ].map(({ label, ok }) => (
                  <span
                    key={label}
                    className={cx(
                      "flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-semibold",
                      ok ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500",
                    )}
                  >
                    {ok
                      ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                    }
                    {label}
                  </span>
                ))}
              </div>

              {/* Flags */}
              {isFlagged && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[10px] bg-red-50 px-3.5 py-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.5px] text-red-600">⚑ FLAGS</span>
                  {r.flags.map((f) => (
                    <span key={f} className="rounded bg-red-100 px-2 py-0.5 text-[11.5px] font-semibold text-red-700">{f}</span>
                  ))}
                </div>
              )}

              {/* Actions */}
              {state.role !== "stakeholder" && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => actions.qaAct(r.id, "approve")}
                    className="flex-1 rounded-[9px] bg-emerald-600 py-2.5 text-[13px] font-bold text-white hover:bg-emerald-700"
                  >
                    ✓ Approve · Verify
                  </button>
                  <button
                    onClick={() => actions.qaAct(r.id, "reject")}
                    className="flex-1 rounded-[9px] border border-red-300 bg-red-50 py-2.5 text-[13px] font-bold text-red-700 hover:bg-red-100"
                  >
                    ✕ Reject
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Payouts ─────────────────────────────────────────────────────────────────

type ReferrerLite = { name: string; method: string; acctNum: string; acctName: string };

// Masked-by-default account/mobile/reference number. Click the number to copy
// the full value (even while masked); Show/Hide reveals it on screen. `name` is
// the account holder shown underneath. `canReveal` is admin-only.
function RevealNumber({ value, name, canReveal }: { value: string; name?: string; canReveal: boolean }) {
  const [shown, setShown] = useState(false);
  // Which field was just copied ("num" | "name" | null), for the "Copied!" hint.
  const [copied, setCopied] = useState<"num" | "name" | null>(null);
  if (!value) return <span className="text-gray-300">—</span>;
  const masked = "•••• " + value.slice(-3);
  const copy = (text: string, which: "num" | "name") => {
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(which);
        setTimeout(() => setCopied(null), 1200);
      })
      .catch(() => { /* clipboard unavailable */ });
  };
  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => copy(value, "num")}
          title="Click to copy"
          className={cx(
            "text-[12.5px] hover:text-[#E0195F]",
            shown ? "font-mono text-[#18181B]" : "text-gray-600",
          )}
        >
          {shown ? value : masked}
        </button>
        {copied === "num" ? (
          <span className="text-[10.5px] font-semibold text-emerald-600">Copied!</span>
        ) : canReveal ? (
          <button
            onClick={() => setShown((v) => !v)}
            title={shown ? "Hide" : "Show"}
            className="flex-none rounded-md border border-[#E4E4E7] px-2 py-0.5 text-[10.5px] font-semibold text-gray-500 hover:bg-[#F7F7F8]"
          >
            {shown ? "Hide" : "Show"}
          </button>
        ) : null}
      </div>
      {name && (
        <div className="mt-0.5 flex items-center gap-2">
          <button
            onClick={() => copy(name, "name")}
            title="Click to copy"
            className="text-[11px] text-gray-400 hover:text-[#E0195F]"
          >
            {name}
          </button>
          {copied === "name" && <span className="text-[10.5px] font-semibold text-emerald-600">Copied!</span>}
        </div>
      )}
    </div>
  );
}

// Shared Approve / Hold / Mark-paid action cell, used for both the respondent
// token and the referrer bonus (each tracks its own status independently).
function PayoutActionCell({
  status,
  role,
  onApprove,
  onHold,
  onMarkPaid,
  disabledReason,
}: {
  status: string;
  role: Role;
  onApprove: () => void;
  onHold: () => void;
  onMarkPaid: () => void;
  disabledReason?: string;
}) {
  if (disabledReason) {
    return <span className="text-[11.5px] font-semibold text-gray-400">{disabledReason}</span>;
  }
  if (status === "Paid") {
    return (
      <span className="text-emerald-600">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </span>
    );
  }
  if (role === "stakeholder") return null;
  if (status === "Approved") {
    return (
      <button onClick={onMarkPaid} className="rounded-[8px] bg-emerald-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-emerald-700">
        Mark paid
      </button>
    );
  }
  if (status === "On Hold") {
    return (
      <button onClick={onApprove} className="rounded-[8px] border border-amber-300 bg-amber-50 px-3 py-1.5 text-[12px] font-bold text-amber-700 hover:bg-amber-100">
        Release
      </button>
    );
  }
  return (
    <div className="flex gap-1.5">
      <button onClick={onApprove} className="rounded-[8px] bg-emerald-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-emerald-700">
        Approve
      </button>
      <button onClick={onHold} className="rounded-[8px] border border-[#E4E4E7] px-3 py-1.5 text-[12px] font-semibold text-gray-500 hover:bg-[#F7F7F8]">
        Hold
      </button>
    </div>
  );
}

function PayoutsView() {
  const { state, actions } = usePortal();
  const isAdmin = state.role === "admin";
  const pt = useMemo(() => payoutTotals(state.respondents, state.incentives), [state.respondents, state.incentives]);
  const verifiedRespondents = useMemo(
    () => state.respondents.filter((r) => r.verified),
    [state.respondents],
  );
  // One referral-bonus row per verified respondent who used a referral code.
  const referralRows = useMemo(
    () => verifiedRespondents.filter((r) => r.referred && bon(state.incentives, r.type) > 0),
    [verifiedRespondents, state.incentives],
  );

  const [tab, setTab] = useState<"respondents" | "referrers">("respondents");
  const [payFilter, setPayFilter] = useState("all");

  // Referrer directory (name + payout details) keyed by referral code, so the
  // Referrers tab can show who is owed the bonus and where to send it.
  const [referrers, setReferrers] = useState<Record<string, ReferrerLite>>({});
  useEffect(() => {
    let active = true;
    fetch("/api/portal/referrers")
      .then((res) => (res.ok ? res.json() : { referrers: [] }))
      .then((data: { referrers?: { referral_code: string; full_name: string; payout_details: { method?: string; acctNum?: string; acctName?: string } | null }[] }) => {
        if (!active) return;
        const map: Record<string, ReferrerLite> = {};
        for (const ref of data.referrers ?? []) {
          map[ref.referral_code] = {
            name: ref.full_name,
            method: ref.payout_details?.method ?? "",
            acctNum: ref.payout_details?.acctNum ?? "",
            acctName: ref.payout_details?.acctName ?? "",
          };
        }
        setReferrers(map);
      })
      .catch(() => { /* non-admins get 403 — referrer details fall back to "—" */ });
    return () => { active = false; };
  }, []);

  const filteredRespondents = useMemo(
    () => payFilter === "all"
      ? verifiedRespondents
      : verifiedRespondents.filter((r) => (r.payStatus || "Pending") === payFilter),
    [verifiedRespondents, payFilter],
  );
  const filteredReferralRows = useMemo(
    () => payFilter === "all"
      ? referralRows
      : referralRows.filter((r) => (r.referrerPayStatus || "Pending") === payFilter),
    [referralRows, payFilter],
  );

  const tabs: [typeof tab, string, number][] = [
    ["respondents", "Respondents", filteredRespondents.length],
    ["referrers", "Referrers", filteredReferralRows.length],
  ];

  const PAY_FILTERS = ["all", "Pending", "Approved", "Paid", "On Hold"];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payout tracking"
        sub="Tracking only — no payment gateway integration. Visible to Prodigitality Admin."
        action={
          <button className="flex items-center gap-1.5 rounded-[9px] border border-[#E4E4E7] bg-white px-3.5 py-2 text-[12.5px] font-semibold text-gray-600 hover:bg-[#F7F7F8]">
            Export payout report
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Tokens pending"  value={peso(pt.tokensPending)} color="#D97706" />
        <StatCard label="Bonuses pending" value={peso(pt.bonusPending)}  color="#7C3AED" />
        <StatCard label="Paid out"        value={peso(pt.paidTotal)}     color="#15803D" />
        <StatCard label="On hold"         value={pt.onHold} />
        <StatCard label="Total verified"  value={verifiedRespondents.length} />
      </div>

      {/* Tabs + Status filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {tabs.map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cx(
                "rounded-[9px] px-3.5 py-2 text-[12.5px] font-bold",
                tab === key ? "bg-[#18181B] text-white" : "border border-[#E4E4E7] bg-white text-gray-600 hover:bg-[#F7F7F8]",
              )}
            >
              {label} · {count}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-[9px] border border-[#E4E4E7] bg-white p-1">
          {PAY_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setPayFilter(f)}
              className={cx(
                "rounded-[7px] px-3 py-1.5 text-[12px] font-semibold transition-colors",
                payFilter === f ? "bg-[#18181B] text-white" : "text-gray-500 hover:text-gray-700",
              )}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {tab === "respondents" && (
        <div className="overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-[#F2F2F4]">
                  {["RESPONDENT", "TOKEN", "METHOD", "ACCOUNT / MOBILE", "PAYOUT STATUS", "ACTION"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.5px] text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRespondents.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-[13px] text-gray-400">No respondents match this filter.</td></tr>
                ) : filteredRespondents.map((r) => {
                  const tokenAmt = tok(state.incentives, r.type);
                  return (
                    <tr key={r.id} className="border-b border-[#F5F5F7] last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[11.5px] font-extrabold text-white" style={{ background: avatarColor(r.name) }}>
                            {initials(r.name)}
                          </div>
                          <div>
                            <div className="text-[13px] font-bold text-[#18181B]">{r.name}</div>
                            <div className="text-[11.5px] text-gray-400">{r.type === "TSI" ? "TSI" : r.type} · {r.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {r.type === "TSI"
                          ? <span className="text-[13px] font-semibold text-gray-700">Tumbler</span>
                          : <span className="text-[13px] font-semibold text-[#18181B]">{peso(tokenAmt)}</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-gray-600">{r.method || "—"}</td>
                      <td className="px-4 py-3">
                        {isAdmin && r.acctNum
                          ? <RevealNumber value={r.acctNum} name={r.acctName} canReveal />
                          : <span className="text-[12.5px] text-gray-600">{r.acct !== "—" ? r.acct : "—"}</span>}
                      </td>
                      <td className="px-4 py-3">{payBadge(r.payStatus || "Pending")}</td>
                      <td className="px-4 py-3">
                        <PayoutActionCell
                          status={r.payStatus || "Pending"}
                          role={state.role}
                          onApprove={() => actions.approvePayout(r.id)}
                          onHold={() => actions.holdPayout(r.id)}
                          onMarkPaid={() => actions.markPaid(r.id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "referrers" && (
        <div className="overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white">
          <div className="border-b border-[#F2F2F4] bg-[#FAFAFB] px-4 py-2.5 text-[11.5px] text-gray-500">
            Referrer bonuses release only after the referred respondent has been paid.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-[#F2F2F4]">
                  {["REFERRER", "REFERRED RESPONDENT", "BONUS", "METHOD", "ACCOUNT / MOBILE", "BONUS STATUS", "ACTION"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.5px] text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReferralRows.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[13px] text-gray-400">{referralRows.length === 0 ? "No referral bonuses yet." : "No referrer bonuses match this filter."}</td></tr>
                ) : filteredReferralRows.map((r) => {
                  const bonusAmt = bon(state.incentives, r.type);
                  const ref = r.referrer ? referrers[r.referrer] : undefined;
                  const refName = ref?.name || r.referredBy || r.referrer || "—";
                  const respondentPaid = r.payStatus === "Paid";
                  const refStatus = r.referrerPayStatus || "Pending";
                  return (
                    <tr key={r.id} className="border-b border-[#F5F5F7] last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[11.5px] font-extrabold text-white" style={{ background: avatarColor(refName) }}>
                            {initials(refName)}
                          </div>
                          <div>
                            <div className="text-[13px] font-bold text-[#18181B]">{refName}</div>
                            <div className="text-[11.5px] text-gray-400">{r.referrer || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[12.5px] font-semibold text-[#18181B]">{r.name}</div>
                        <div className="text-[11.5px] text-gray-400">{r.type === "TSI" ? "TSI" : r.type}</div>
                      </td>
                      <td className="px-4 py-3"><span className="text-[13px] font-semibold text-emerald-700">{peso(bonusAmt)}</span></td>
                      <td className="px-4 py-3 text-[12.5px] text-gray-600">{ref?.method || "—"}</td>
                      <td className="px-4 py-3">
                        {isAdmin && ref?.acctNum
                          ? <RevealNumber value={ref.acctNum} name={ref.acctName} canReveal />
                          : <span className="text-[12.5px] text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">{payBadge(refStatus)}</td>
                      <td className="px-4 py-3">
                        <PayoutActionCell
                          status={refStatus}
                          role={state.role}
                          onApprove={() => actions.approveReferrerPayout(r.id)}
                          onHold={() => actions.holdReferrerPayout(r.id)}
                          onMarkPaid={() => actions.markReferrerPaid(r.id)}
                          disabledReason={respondentPaid ? undefined : "Pay respondent first"}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Accounts (Enumerators / Stakeholders) ─────────────────────────────────────

type ProfileUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "enumerator" | "stakeholder";
  status: "pending" | "approved" | "rejected";
  is_email_verified: boolean;
  slug: string | null;
  mobile: string | null;
  region: string | null;
  organization: string | null;
  payout_details: { method?: string; acctName?: string; acctNum?: string; bank?: string } | null;
  rejected_reason: string | null;
  created_at: string;
};

const ACCOUNT_TABS: { key: ProfileUser["status"]; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

// Shared account-management list for a single role, with status tabs and
// approve/reject actions. Used by the Enumerators and Stakeholders pages.
function AccountsList({
  role,
  title,
  sub,
}: {
  role: "enumerator" | "stakeholder";
  title: string;
  sub: string;
}) {
  const [tab, setTab] = useState<ProfileUser["status"]>("pending");
  const [users, setUsers] = useState<ProfileUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/portal/users?role=${role}&status=${tab}`);
        const data = await res.json();
        if (active) setUsers(res.ok ? (data.users ?? []) : []);
      } catch {
        if (active) setUsers([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [tab, role]);

  const act = async (id: string, action: "approve" | "reject") => {
    const reason =
      action === "reject"
        ? window.prompt("Reason for rejection (optional):") ?? undefined
        : undefined;
    setBusyId(id);
    setNotice("");
    try {
      const res = await fetch(`/api/portal/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setNotice(action === "approve" ? "Account approved." : "Account rejected.");
      } else {
        const data = await res.json().catch(() => ({}));
        setNotice(data.error ?? "Action failed.");
      }
    } catch {
      setNotice("Network error.");
    } finally {
      setBusyId(null);
    }
  };

  const isEnum = role === "enumerator";
  const headers = isEnum
    ? ["USER", "MOBILE", "REGION", "SLUG", "EMAIL VERIFIED", "PAYOUT", tab === "pending" ? "ACTION" : "STATUS"]
    : ["USER", "MOBILE", "ORGANIZATION", "EMAIL VERIFIED", tab === "pending" ? "ACTION" : "STATUS"];

  const payoutLabel = (p: ProfileUser["payout_details"]) => {
    if (!p || !p.method) return "—";
    return p.acctNum ? `${p.method} · ${p.acctNum}` : p.method;
  };

  return (
    <div className="space-y-4">
      <PageHeader title={title} sub={sub} />

      {/* Tabs */}
      <div className="flex gap-1 rounded-[9px] border border-[#E4E4E7] bg-white p-1 w-fit">
        {ACCOUNT_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              "rounded-[7px] px-3.5 py-1.5 text-[12px] font-semibold",
              tab === t.key ? "bg-[#18181B] text-white" : "text-gray-500 hover:text-gray-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {notice && (
        <div className="rounded-[9px] border border-[#E4E4E7] bg-[#F7F7F8] px-3.5 py-2.5 text-[12.5px] font-semibold text-gray-600">
          {notice}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white">
        {loading ? (
          <div className="py-14 text-center text-[13.5px] text-gray-400">Loading…</div>
        ) : users.length === 0 ? (
          <div className="py-14 text-center text-[13.5px] text-gray-400">No {tab} {role}s.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-[#F2F2F4]">
                  {headers.map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.5px] text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[#F5F5F7] last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[11.5px] font-extrabold text-white" style={{ background: avatarColor(u.full_name || u.email) }}>
                          {initials(u.full_name || u.email)}
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-[#18181B]">{u.full_name || "—"}</div>
                          <div className="text-[11.5px] text-gray-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-gray-600">{u.mobile || "—"}</td>
                    {isEnum ? (
                      <>
                        <td className="px-4 py-3 text-[12.5px] text-gray-600">{u.region || "—"}</td>
                        <td className="px-4 py-3 font-mono text-[12px] text-gray-600">{u.slug || "—"}</td>
                      </>
                    ) : (
                      <td className="px-4 py-3 text-[12.5px] text-gray-600">{u.organization || "—"}</td>
                    )}
                    <td className="px-4 py-3">
                      {u.is_email_verified
                        ? <span className="text-[12.5px] font-semibold text-emerald-700">Verified</span>
                        : <span className="text-[12.5px] font-semibold text-amber-600">Pending</span>}
                    </td>
                    {isEnum && (
                      <td className="px-4 py-3 text-[12.5px] text-gray-600">{payoutLabel(u.payout_details)}</td>
                    )}
                    <td className="px-4 py-3">
                      {tab === "pending" ? (
                        <div className="flex gap-1.5">
                          <button
                            disabled={busyId === u.id || !u.is_email_verified}
                            onClick={() => act(u.id, "approve")}
                            title={u.is_email_verified ? "" : "User must verify their email first"}
                            className="rounded-[8px] bg-emerald-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
                          >
                            Approve
                          </button>
                          <button
                            disabled={busyId === u.id}
                            onClick={() => act(u.id, "reject")}
                            className="rounded-[8px] border border-red-300 bg-red-50 px-3 py-1.5 text-[12px] font-bold text-red-700 hover:bg-red-100 disabled:opacity-40"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className={cx(
                          "rounded-md border px-2 py-0.5 text-[11.5px] font-semibold",
                          u.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200",
                        )}>
                          {u.status}
                        </span>
                      )}
                    </td>
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

function EnumeratorsView() {
  const { state } = usePortal();
  const [users, setUsers] = useState<ProfileUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/portal/users?role=enumerator");
        const data = await res.json();
        if (active) setUsers(res.ok ? (data.users ?? []) : []);
      } catch {
        if (active) setUsers([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const act = async (id: string, action: "approve" | "reject") => {
    const reason =
      action === "reject"
        ? window.prompt("Reason for rejection (optional):") ?? undefined
        : undefined;
    setBusyId(id);
    setNotice("");
    try {
      const res = await fetch(`/api/portal/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, status: action === "approve" ? "approved" : "rejected" } : u,
          ),
        );
        setNotice(action === "approve" ? "Enumerator approved." : "Enumerator rejected.");
      } else {
        const data = await res.json().catch(() => ({}));
        setNotice(data.error ?? "Action failed.");
      }
    } catch {
      setNotice("Network error.");
    } finally {
      setBusyId(null);
    }
  };

  const pending = users.filter((u) => u.status === "pending");
  const approved = users.filter((u) => u.status === "approved");
  const rejected = users.filter((u) => u.status === "rejected");

  // Performance stats for approved enumerators, keyed by email.
  const stats = useMemo(() => {
    const cards = enumCards(
      approved.map((u) => ({ name: u.full_name || u.email, email: u.email })),
      state.respondents,
      initials,
    );
    return new Map(cards.map((c) => [c.email, c]));
  }, [approved, state.respondents]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enumerators"
        sub="All field enumerator accounts, grouped by approval status."
      />

      {notice && (
        <div className="rounded-[9px] border border-[#E4E4E7] bg-[#F7F7F8] px-3.5 py-2.5 text-[12.5px] font-semibold text-gray-600">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-[#E4E4E7] bg-white py-14 text-center text-[13.5px] text-gray-400">
          Loading…
        </div>
      ) : (
        <>
          {/* Pending approval */}
          <section className="space-y-3">
            <SectionHeader label="Pending approval" count={pending.length} accent="#D97706" />
            {pending.length === 0 ? (
              <EmptyNote>No enumerators awaiting approval.</EmptyNote>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {pending.map((u) => (
                  <div key={u.id} className="rounded-2xl border border-amber-200 bg-white p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-[13px] font-extrabold text-white" style={{ background: avatarColor(u.full_name || u.email) }}>
                        {initials(u.full_name || u.email)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-bold text-[#18181B]">{u.full_name || "—"}</div>
                        <div className="truncate text-[12px] text-gray-400">{u.email}</div>
                      </div>
                      {u.is_email_verified ? (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">Email verified</span>
                      ) : (
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">Unverified</span>
                      )}
                    </div>
                    <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-gray-500">
                      <span>Mobile: <span className="text-gray-700">{u.mobile || "—"}</span></span>
                      <span>Region: <span className="text-gray-700">{u.region || "—"}</span></span>
                      <span>Handle: <span className="font-mono text-gray-700">{u.slug || "—"}</span></span>
                      <span>Payout: <span className="text-gray-700">{u.payout_details?.method || "—"}</span></span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={busyId === u.id || !u.is_email_verified}
                        onClick={() => act(u.id, "approve")}
                        title={u.is_email_verified ? "" : "User must verify their email first"}
                        className="flex-1 rounded-[9px] bg-emerald-600 py-2 text-[12.5px] font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
                      >
                        Approve
                      </button>
                      <button
                        disabled={busyId === u.id}
                        onClick={() => act(u.id, "reject")}
                        className="flex-1 rounded-[9px] border border-red-300 bg-red-50 py-2 text-[12.5px] font-bold text-red-700 hover:bg-red-100 disabled:opacity-40"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Approved */}
          <section className="space-y-3">
            <SectionHeader label="Approved" count={approved.length} accent="#15803D" />
            {approved.length === 0 ? (
              <EmptyNote>No approved enumerators yet.</EmptyNote>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {approved.map((u) => {
                  const s = stats.get(u.email) ?? { assigned: 0, completed: 0, followups: 0, rate: 0 };
                  return (
                    <div key={u.id} className="rounded-2xl border border-[#E4E4E7] bg-white p-5">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-[13px] font-extrabold text-white" style={{ background: avatarColor(u.full_name || u.email) }}>
                          {initials(u.full_name || u.email)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-bold text-[#18181B]">{u.full_name || "—"}</div>
                          <div className="truncate text-[12px] text-gray-400">{u.email}</div>
                        </div>
                        {u.slug && (
                          <span className="rounded-md bg-[#F4F4F5] px-2 py-0.5 font-mono text-[11px] text-gray-600">{u.slug}</span>
                        )}
                      </div>
                      <div className="mb-3 text-[11.5px] text-gray-400">{s.assigned} assigned respondents</div>
                      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-[18px] font-extrabold text-[#18181B]">{s.completed}</div>
                          <div className="text-[11px] text-gray-400">Completed</div>
                        </div>
                        <div>
                          <div className="text-[18px] font-extrabold text-orange-600">{s.followups}</div>
                          <div className="text-[11px] text-gray-400">Follow-ups</div>
                        </div>
                        <div>
                          <div className="text-[18px] font-extrabold text-[#18181B]">{s.rate}%</div>
                          <div className="text-[11px] text-gray-400">Completion</div>
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0F0F2]">
                        <div className="h-full rounded-full" style={{ width: `${s.rate}%`, background: "#E0195F" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Rejected (only when present) */}
          {rejected.length > 0 && (
            <section className="space-y-3">
              <SectionHeader label="Rejected" count={rejected.length} accent="#DC2626" />
              <div className="overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white">
                {rejected.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 border-b border-[#F5F5F7] px-4 py-3 last:border-0">
                    <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[11.5px] font-extrabold text-white" style={{ background: avatarColor(u.full_name || u.email) }}>
                      {initials(u.full_name || u.email)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold text-[#18181B]">{u.full_name || "—"}</div>
                      <div className="truncate text-[11.5px] text-gray-400">
                        {u.email}{u.rejected_reason ? ` · ${u.rejected_reason}` : ""}
                      </div>
                    </div>
                    <button
                      disabled={busyId === u.id || !u.is_email_verified}
                      onClick={() => act(u.id, "approve")}
                      className="flex-none rounded-[8px] border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
                    >
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function SectionHeader({ label, count, accent }: { label: string; count: number; accent: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
      <h2 className="text-[14px] font-bold text-[#18181B]">{label}</h2>
      <span className="rounded-full bg-[#F4F4F5] px-2 py-0.5 text-[11.5px] font-bold text-gray-500">{count}</span>
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#E4E4E7] bg-white py-8 text-center text-[12.5px] text-gray-400">
      {children}
    </div>
  );
}

function StakeholdersView() {
  return (
    <AccountsList
      role="stakeholder"
      title="Stakeholders"
      sub="Stakeholder accounts. Review and approve new signups before they can access the portal."
    />
  );
}

// ─── Reports ─────────────────────────────────────────────────────────────────

const REPORT_DEFS = [
  { name: "Full respondent list",  desc: "All 114 records",              icon: "📋", fmts: ["CSV", "Excel"] },
  { name: "Verified respondents",  desc: "Verified only",                icon: "✅", fmts: ["CSV", "Excel"] },
  { name: "Survey answers",        desc: "KoboToolbox-compatible",       icon: "📝", fmts: ["CSV", "Kobo"] },
  { name: "Referral report",       desc: "Referrers & conversions",      icon: "🔗", fmts: ["CSV", "Excel"] },
  { name: "Payout report",         desc: "Admin only",                   icon: "💳", fmts: ["CSV", "Excel"] },
  { name: "Audit log",             desc: "Full action history",          icon: "📒", fmts: ["CSV"] },
] as const;

// Shopify-style analytics report: pick a dimension to group submissions by
// (Date submitted, Path, Region, Status, Collection mode) and read the metric
// columns (submissions, verified, pending QA, conversion). A path filter scopes
// the dataset first. All figures are non-monetary, safe for stakeholders.
type ReportDimension = "date" | "path" | "region" | "status" | "mode";

const DIMENSIONS: { key: ReportDimension; label: string }[] = [
  { key: "date",   label: "Date submitted" },
  { key: "path",   label: "Path" },
  { key: "region", label: "Region" },
  { key: "status", label: "Profile status" },
  { key: "mode",   label: "Collection mode" },
];

const PATH_LABEL: Record<string, string> = { TSI: "TSI", AgriTech: "Agri-Tech", SME: "SME" };

function dimensionValue(r: Respondent, dim: ReportDimension): { key: string; label: string; sort: number } {
  switch (dim) {
    case "date": {
      const d = r.submittedAt ? new Date(r.submittedAt) : null;
      const label = d
        ? d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
        : "—";
      return { key: label, label, sort: d ? d.getTime() : 0 };
    }
    case "path":
      return { key: r.type, label: PATH_LABEL[r.type] ?? r.type, sort: 0 };
    case "region":
      return { key: r.region || "—", label: r.region || "—", sort: 0 };
    case "status":
      return { key: r.status as string, label: r.status as string, sort: 0 };
    case "mode":
      return { key: r.mode, label: r.mode, sort: 0 };
  }
}

interface ReportRow {
  key: string;
  label: string;
  sort: number;
  submissions: number;
  verified: number;
  pendingQa: number;
}

function SubmissionsReport({ respondents }: { respondents: Respondent[] }) {
  const [dim, setDim] = useState<ReportDimension>("date");
  const [path, setPath] = useState<"all" | "TSI" | "AgriTech" | "SME">("all");
  const pathOpts = ["all", "TSI", "AgriTech", "SME"] as const;
  const pathLbl: Record<string, string> = { all: "All paths", TSI: "TSI", AgriTech: "Agri-Tech", SME: "SME" };

  const visible = useMemo(
    () => respondents.filter((r) => path === "all" || r.type === path),
    [respondents, path],
  );

  const rows = useMemo(() => {
    const map = new Map<string, ReportRow>();
    for (const r of visible) {
      const { key, label, sort } = dimensionValue(r, dim);
      let row = map.get(key);
      if (!row) {
        row = { key, label, sort, submissions: 0, verified: 0, pendingQa: 0 };
        map.set(key, row);
      }
      row.submissions += 1;
      if (r.verified) row.verified += 1;
      if (r.status === "Pending QA") row.pendingQa += 1;
    }
    const arr = [...map.values()];
    // Date dimension sorts newest-first; everything else by submission volume.
    arr.sort((a, b) => (dim === "date" ? b.sort - a.sort : b.submissions - a.submissions));
    return arr;
  }, [visible, dim]);

  const totals = useMemo(
    () => rows.reduce(
      (t, r) => ({
        submissions: t.submissions + r.submissions,
        verified: t.verified + r.verified,
        pendingQa: t.pendingQa + r.pendingQa,
      }),
      { submissions: 0, verified: 0, pendingQa: 0 },
    ),
    [rows],
  );

  // Per-respondent detail list (path-scoped), newest submission first.
  const detailRows = useMemo(
    () => visible.slice().sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? "")),
    [visible],
  );

  const conv = (v: number, s: number) => (s ? Math.round((v / s) * 100) + "%" : "—");
  const dimLabel = DIMENSIONS.find((d) => d.key === dim)?.label ?? "Dimension";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[14px] font-bold text-[#18181B]">Submissions report</div>
          <div className="text-[12px] text-gray-500">{totals.submissions} submission{totals.submissions !== 1 ? "s" : ""} · grouped by {dimLabel.toLowerCase()}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Dimension (group by) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11.5px] font-semibold text-gray-400">Group by</span>
            <select
              value={dim}
              onChange={(e) => setDim(e.target.value as ReportDimension)}
              className="h-9 rounded-[9px] border border-[#E4E4E7] bg-white px-3 text-[12.5px] font-semibold text-gray-600 focus:border-gray-400 focus:outline-none"
            >
              {DIMENSIONS.map((d) => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          </div>
          {/* Path filter */}
          <select
            value={path}
            onChange={(e) => setPath(e.target.value as typeof path)}
            className="h-9 rounded-[9px] border border-[#E4E4E7] bg-white px-3 text-[12.5px] font-semibold text-gray-600 focus:border-gray-400 focus:outline-none"
          >
            {pathOpts.map((p) => (
              <option key={p} value={p}>{pathLbl[p]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Graph — line over time, grouped bars for categories */}
      <div className="rounded-2xl border border-[#E4E4E7] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[24px] font-extrabold tracking-[-0.5px] text-[#18181B]">{totals.submissions}</div>
            <div className="text-[11.5px] text-gray-400">Total submissions</div>
          </div>
          <SeriesLegend />
        </div>
        {rows.length === 0 ? (
          <div className="py-10 text-center text-[12.5px] text-gray-400">No data to chart.</div>
        ) : dim === "date" ? (
          <div className="overflow-x-auto">
            <TwoSeriesLineChart
              points={rows.slice().reverse().map((r) => ({ label: r.label, a: r.submissions, b: r.verified }))}
            />
          </div>
        ) : (
          <GroupedBars rows={rows.map((r) => ({ label: r.label, a: r.submissions, b: r.verified }))} />
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white">
        {rows.length === 0 ? (
          <div className="py-14 text-center text-[13.5px] text-gray-400">No submissions for this path.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-[#F2F2F4]">
                  <th className="px-4 py-3 text-[10.5px] font-bold uppercase tracking-[0.5px] text-gray-400">{dimLabel}</th>
                  {["Submissions", "Verified", "Pending QA", "Conversion"].map((h) => (
                    <th key={h} className="px-4 py-3 text-right text-[10.5px] font-bold uppercase tracking-[0.5px] text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-b border-[#F5F5F7] hover:bg-[#FAFAFA] last:border-0">
                    <td className="px-4 py-3 text-[12.5px] font-semibold text-[#18181B]">{r.label}</td>
                    <td className="px-4 py-3 text-right text-[12.5px] text-gray-700">{r.submissions}</td>
                    <td className="px-4 py-3 text-right text-[12.5px] text-emerald-700 font-semibold">{r.verified}</td>
                    <td className="px-4 py-3 text-right text-[12.5px] text-amber-600">{r.pendingQa}</td>
                    <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-[#18181B]">{conv(r.verified, r.submissions)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#E4E4E7] bg-[#FAFAFB]">
                  <td className="px-4 py-3 text-[12px] font-bold uppercase tracking-[0.4px] text-gray-500">Total</td>
                  <td className="px-4 py-3 text-right text-[13px] font-bold text-[#18181B]">{totals.submissions}</td>
                  <td className="px-4 py-3 text-right text-[13px] font-bold text-emerald-700">{totals.verified}</td>
                  <td className="px-4 py-3 text-right text-[13px] font-bold text-amber-600">{totals.pendingQa}</td>
                  <td className="px-4 py-3 text-right text-[13px] font-bold text-[#18181B]">{conv(totals.verified, totals.submissions)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Per-respondent detail — who submitted, path, enumerator, referrer */}
      <div className="overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white">
        <div className="border-b border-[#F2F2F4] px-4 py-2.5 text-[12px] font-bold text-[#18181B]">
          Submission detail · {visible.length}
        </div>
        {visible.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-gray-400">No submissions for this path.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-[#F2F2F4]">
                  {["RESPONDENT", "PATH", "SUBMITTED", "MODE", "ENUMERATOR", "REFERRED BY", "STATUS"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[10.5px] font-bold uppercase tracking-[0.5px] text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailRows.map((r) => (
                  <tr key={r.id} className="border-b border-[#F5F5F7] hover:bg-[#FAFAFA] last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[11.5px] font-extrabold text-white" style={{ background: avatarColor(r.name) }}>
                          {initials(r.name)}
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-[#18181B]">{r.name}</div>
                          <div className="text-[11.5px] text-gray-400">{r.org || r.email || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{typeBadge(r.type)}</td>
                    <td className="px-4 py-3 text-[12.5px] text-gray-600">
                      {r.submittedAt
                        ? new Date(r.submittedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cx(
                        "rounded-md px-2 py-0.5 text-[11.5px] font-semibold",
                        r.mode === "Self-service" ? "bg-gray-100 text-gray-600" : "bg-blue-50 text-blue-700",
                      )}>
                        {r.mode === "Self-service" ? "Self-service" : "Enumerator-assisted"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-gray-600">{r.enumerator || "—"}</td>
                    <td className="px-4 py-3 text-[12.5px] text-gray-600">
                      {r.referredBy || r.referrer
                        ? <span>{r.referredBy || "—"}{r.referrer ? <span className="text-gray-400"> · {r.referrer}</span> : null}</span>
                        : "—"}
                    </td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
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

// ── Chart + report primitives (hand-rolled, no chart library) ──────────────────

const SERIES_SUBS = "#18181B";
const SERIES_VERIFIED = "#059669";
const SCALE_PALETTE = ["#E0195F", "#F97316", "#F59E0B", "#10B981", "#059669", "#9CA3AF"];

function SeriesLegend() {
  return (
    <div className="flex items-center gap-4 text-[11.5px] text-gray-500">
      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES_SUBS }} />Submissions</span>
      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES_VERIFIED }} />Verified</span>
    </div>
  );
}

// Two-series SVG line chart (submissions + verified) over an ordered set of points.
function TwoSeriesLineChart({ points }: { points: { label: string; a: number; b: number }[] }) {
  const h = 200, padX = 40, padTop = 14, padBottom = 34, gap = 72;
  const w = Math.max(560, padX * 2 + Math.max(1, points.length - 1) * gap);
  const max = Math.max(1, ...points.map((p) => Math.max(p.a, p.b)));
  const x = (i: number) => (points.length <= 1 ? w / 2 : padX + (i * (w - padX * 2)) / (points.length - 1));
  const y = (v: number) => padTop + (h - padTop - padBottom) * (1 - v / max);
  const line = (key: "a" | "b") => points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");
  const ticks = 4;
  return (
    <svg width={w} height={h} className="block">
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const gy = padTop + ((h - padTop - padBottom) * i) / ticks;
        const val = Math.round(max - (max * i) / ticks);
        return (
          <g key={i}>
            <line x1={padX} y1={gy} x2={w - padX} y2={gy} stroke="#F0F0F2" strokeWidth={1} />
            <text x={padX - 8} y={gy + 3} textAnchor="end" fontSize="9.5" fill="#9CA3AF">{val}</text>
          </g>
        );
      })}
      <path d={line("a")} fill="none" stroke={SERIES_SUBS} strokeWidth={2} />
      <path d={line("b")} fill="none" stroke={SERIES_VERIFIED} strokeWidth={2} />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.a)} r={3} fill={SERIES_SUBS} />
          <circle cx={x(i)} cy={y(p.b)} r={3} fill={SERIES_VERIFIED} />
          <text x={x(i)} y={h - 12} textAnchor="middle" fontSize="9.5" fill="#9CA3AF">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

// Grouped horizontal bars for categorical dimensions (submissions vs verified).
function GroupedBars({ rows }: { rows: { label: string; a: number; b: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => Math.max(r.a, r.b)));
  return (
    <div className="space-y-3.5">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex items-center justify-between text-[12px]">
            <span className="font-semibold text-gray-700">{r.label}</span>
            <span className="text-gray-400">{r.a} subs · {r.b} verified</span>
          </div>
          <div className="space-y-1">
            <div className="h-2.5 overflow-hidden rounded-full bg-[#F0F0F2]"><div className="h-full rounded-full" style={{ width: `${(r.a / max) * 100}%`, background: SERIES_SUBS }} /></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#F0F0F2]"><div className="h-full rounded-full" style={{ width: `${(r.b / max) * 100}%`, background: SERIES_VERIFIED }} /></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// One labelled progress bar (used by survey responses + group breakdown).
function HBar({ label, count, pct, color = "#E0195F" }: { label: string; count: number; pct: number; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-[200px] flex-none truncate text-[12px] text-gray-600" title={label}>{label}</div>
      <div className="flex-1 overflow-hidden rounded-full bg-[#F0F0F2]" style={{ height: 8 }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="w-[72px] flex-none text-right text-[11.5px] font-semibold text-gray-700">{count} · {pct}%</div>
    </div>
  );
}

// Stacked single bar across a fixed scale (matrix row distribution).
function StackedBar({ options }: { options: { label: string; count: number }[] }) {
  const total = options.reduce((s, o) => s + o.count, 0) || 1;
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#F0F0F2]">
      {options.map((o, i) =>
        o.count > 0 ? (
          <div key={o.label} title={`${o.label}: ${o.count}`} style={{ width: `${(o.count / total) * 100}%`, background: SCALE_PALETTE[i % SCALE_PALETTE.length] }} />
        ) : null,
      )}
    </div>
  );
}

// ── Survey responses report (Google Forms style) ──────────────────────────────

function SurveyResponsesReport({ respondents }: { respondents: Respondent[] }) {
  const paths: RespondentType[] = ["SME", "AgriTech", "TSI"];
  const [path, setPath] = useState<RespondentType>(
    () => paths.find((p) => respondents.some((r) => r.type === p)) ?? "SME",
  );
  const summaries = useMemo(() => aggregateResponses(respondents, path), [respondents, path]);
  const respCount = useMemo(() => respondents.filter((r) => r.type === path).length, [respondents, path]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[14px] font-bold text-[#18181B]">Survey responses</div>
          <div className="text-[12px] text-gray-500">{respCount} respondent{respCount !== 1 ? "s" : ""} on the {PATH_LABEL[path]} path</div>
        </div>
        <div className="flex gap-1 rounded-[9px] border border-[#E4E4E7] bg-white p-1">
          {paths.map((p) => {
            const n = respondents.filter((r) => r.type === p).length;
            return (
              <button
                key={p}
                onClick={() => setPath(p)}
                className={cx(
                  "rounded-[7px] px-3 py-1.5 text-[12px] font-semibold",
                  path === p ? "bg-[#18181B] text-white" : "text-gray-500 hover:text-gray-700",
                )}
              >
                {PATH_LABEL[p]} · {n}
              </button>
            );
          })}
        </div>
      </div>

      {respCount === 0 ? (
        <div className="rounded-2xl border border-[#E4E4E7] bg-white py-14 text-center text-[13.5px] text-gray-400">No responses on this path yet.</div>
      ) : (
        <div className="space-y-3">
          {summaries.map((q) => (
            <div key={q.id} className="rounded-2xl border border-[#E4E4E7] bg-white p-5">
              <div className="mb-1 text-[13px] font-bold text-[#18181B]">{q.label}</div>
              <div className="mb-3 text-[11.5px] text-gray-400">{q.answered} response{q.answered !== 1 ? "s" : ""}</div>

              {(q.kind === "radio" || q.kind === "select" || q.kind === "multi") && (
                <div className="space-y-2">
                  {q.options && q.options.length > 0 ? (
                    q.options.map((o, i) => <HBar key={o.label} label={o.label} count={o.count} pct={o.pct} color={SCALE_PALETTE[i % SCALE_PALETTE.length]} />)
                  ) : (
                    <div className="text-[12px] text-gray-400">No answers.</div>
                  )}
                </div>
              )}

              {q.kind === "matrix" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {(q.scale ?? []).map((s, i) => (
                      <span key={s} className="flex items-center gap-1.5 text-[10.5px] text-gray-500">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: SCALE_PALETTE[i % SCALE_PALETTE.length] }} />{s}
                      </span>
                    ))}
                  </div>
                  {(q.rows ?? []).map((row) => (
                    <div key={row.row}>
                      <div className="mb-1 text-[12px] text-gray-600">{row.row}</div>
                      <StackedBar options={row.options} />
                    </div>
                  ))}
                </div>
              )}

              {q.kind === "number" && (
                <div className="text-[12.5px] text-gray-600">
                  {q.numberStats
                    ? <>Average <span className="font-semibold text-[#18181B]">{q.numberStats.avg}</span> · min {q.numberStats.min} · max {q.numberStats.max}</>
                    : "No numeric answers."}
                </div>
              )}

              {q.kind === "text" && (
                q.texts && q.texts.length > 0 ? (
                  <div className="max-h-[260px] space-y-2 overflow-y-auto">
                    {q.texts.map((t, i) => (
                      <div key={i} className="rounded-[10px] border border-[#F0F0F2] bg-[#FAFAFB] px-3.5 py-2 text-[12.5px] text-gray-700">{t}</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[12px] text-gray-400">No written responses.</div>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Group progress report (detailed) ──────────────────────────────────────────

function GroupProgressReport() {
  const { state } = usePortal();
  const rows = useMemo(() => groupBreakdown(state.respondents, state.targets), [state.respondents, state.targets]);
  const pctOf = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
  return (
    <div className="space-y-4">
      <div className="text-[14px] font-bold text-[#18181B]">Progress by respondent group</div>
      <div className="grid gap-4 lg:grid-cols-3">
        {rows.map((g) => (
          <div key={g.type} className="rounded-2xl border border-[#E4E4E7] bg-white p-5">
            <div className="mb-1 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: g.color }} />
              <span className="text-[13px] font-bold text-[#18181B]">{g.label}</span>
            </div>
            <div className="mb-3 flex items-end gap-2">
              <span className="text-[26px] font-extrabold leading-none" style={{ color: g.color }}>{g.verified}</span>
              <span className="mb-0.5 text-[13px] text-gray-400">/ {g.target} target · {g.pct}%</span>
            </div>
            <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-[#EFEFF1]">
              <div className="h-full rounded-full" style={{ width: `${g.pct}%`, background: g.color }} />
            </div>
            <div className="space-y-2">
              {([
                ["Registered", g.registered],
                ["Email verified", g.emailV],
                ["Survey done", g.surveyDone],
                ["Selfie", g.selfie],
                ["Verified", g.verified],
                ["Rejected", g.rejected],
              ] as [string, number][]).map(([label, val]) => (
                <HBar key={label} label={label} count={val} pct={pctOf(val, g.registered)} color={g.color} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Verification funnel report (detailed) ─────────────────────────────────────

function VerificationFunnelReport() {
  const { state } = usePortal();
  const [path, setPath] = useState<"all" | RespondentType>("all");
  const pathOpts: ("all" | RespondentType)[] = ["all", "TSI", "AgriTech", "SME"];
  const pathLbl: Record<string, string> = { all: "All paths", TSI: "TSI", AgriTech: "Agri-Tech", SME: "SME" };
  const totalTarget = state.targets.TSI + state.targets.AgriTech + state.targets.SME;

  const steps = useMemo(() => {
    const scoped = path === "all" ? state.respondents : state.respondents.filter((r) => r.type === path);
    return funnelDetail(scoped, counts(scoped), totalTarget);
  }, [state.respondents, path, totalTarget]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[14px] font-bold text-[#18181B]">Verification funnel</div>
        <div className="flex gap-1 rounded-[9px] border border-[#E4E4E7] bg-white p-1">
          {pathOpts.map((p) => (
            <button
              key={p}
              onClick={() => setPath(p)}
              className={cx(
                "rounded-[7px] px-3 py-1.5 text-[12px] font-semibold",
                path === p ? "bg-[#18181B] text-white" : "text-gray-500 hover:text-gray-700",
              )}
            >
              {pathLbl[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Funnel bars */}
      <div className="rounded-2xl border border-[#E4E4E7] bg-white p-5">
        <div className="space-y-2.5">
          {steps.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-[140px] flex-none text-[12px] font-semibold text-gray-500">{s.label}</div>
              <div className="flex-1 overflow-hidden rounded-full bg-[#F0F0F2]" style={{ height: 10 }}>
                <div className="h-full rounded-full" style={{ width: `${s.pctOfTotal}%`, background: "linear-gradient(90deg, #E0195F 0%, #F97316 100%)" }} />
              </div>
              <div className="w-10 flex-none text-right text-[12.5px] font-bold text-gray-700">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail table */}
      <div className="overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="border-b border-[#F2F2F4]">
                <th className="px-4 py-3 text-[10.5px] font-bold uppercase tracking-[0.5px] text-gray-400">Stage</th>
                {["Count", "% of registered", "Step conversion"].map((h) => (
                  <th key={h} className="px-4 py-3 text-right text-[10.5px] font-bold uppercase tracking-[0.5px] text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {steps.map((s) => (
                <tr key={s.label} className="border-b border-[#F5F5F7] last:border-0">
                  <td className="px-4 py-3 text-[12.5px] font-semibold text-[#18181B]">{s.label}</td>
                  <td className="px-4 py-3 text-right text-[12.5px] text-gray-700">{s.value}</td>
                  <td className="px-4 py-3 text-right text-[12.5px] text-gray-600">{s.pctOfTotal}%</td>
                  <td className="px-4 py-3 text-right text-[12.5px] font-semibold text-[#18181B]">{s.stepPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const REPORT_TABS = [
  { key: "exports",     label: "Exports" },
  { key: "submissions", label: "Submissions" },
  { key: "responses",   label: "Survey responses" },
  { key: "groups",      label: "Group progress" },
  { key: "funnel",      label: "Verification funnel" },
] as const;
type ReportTab = (typeof REPORT_TABS)[number]["key"];

function ReportsView() {
  const { state, actions } = usePortal();
  const [tab, setTab] = useState<ReportTab>("exports");
  // Deep-link support: dashboard CTAs navigate with a #hash selecting the tab.
  useEffect(() => {
    const h = window.location.hash.replace("#", "");
    if (REPORT_TABS.some((t) => t.key === h)) setTab(h as ReportTab);
  }, []);

  // Stakeholders never see monetary data — the payout report is hidden for them.
  const reports = state.role === "stakeholder"
    ? REPORT_DEFS.filter((r) => r.name !== "Payout report")
    : REPORT_DEFS;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports & Export"
        sub="Exports, submissions analytics, survey responses, and pipeline reports."
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {REPORT_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              "rounded-[9px] px-3.5 py-2 text-[12.5px] font-bold",
              tab === t.key ? "bg-[#18181B] text-white" : "border border-[#E4E4E7] bg-white text-gray-600 hover:bg-[#F7F7F8]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "exports" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {reports.map((r) => (
            <div key={r.name} className="flex items-start gap-4 rounded-2xl border border-[#E4E4E7] bg-white p-5">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] bg-[#F7F7F8] text-[20px]">
                {r.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-0.5 text-[13.5px] font-bold text-[#18181B]">{r.name}</div>
                <div className="mb-3 text-[12px] text-gray-500">{r.desc}</div>
                <div className="flex gap-2">
                  {r.fmts.map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => actions.doExport(r.name, fmt)}
                      className="rounded-[8px] border border-[#E4E4E7] bg-[#F7F7F8] px-3.5 py-1.5 text-[12px] font-semibold text-gray-600 hover:bg-white hover:border-gray-300"
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "submissions" && <SubmissionsReport respondents={state.respondents} />}
      {tab === "responses"   && <SurveyResponsesReport respondents={state.respondents} />}
      {tab === "groups"      && <GroupProgressReport />}
      {tab === "funnel"      && <VerificationFunnelReport />}
    </div>
  );
}

// ─── Emails ──────────────────────────────────────────────────────────────────

/** Replaces {{varName}} in text with a highlighted span showing the sample value. */
function renderDynamic(text: string, vars: Record<string, string>, accent: string) {
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return (
    <>
      {parts.map((part, i) => {
        const key = part.match(/^\{\{([^}]+)\}\}$/)?.[1];
        if (key) {
          return (
            <span
              key={i}
              className="rounded px-[3px] py-[1px] font-semibold"
              style={{ background: accent + "22", color: accent }}
            >
              {vars[key] ?? part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

const LIVE_EMAIL_IDS = new Set(["verify", "invite", "verified", "rejected", "paid", "paid-tumbler", "refbonus"]);

function EmailsView() {
  const { state, actions } = usePortal();
  const defs = useMemo(() => emailDefs(), []);
  const sel  = defs.find((d) => d.id === state.emailSel) ?? defs[0];

  const sections = [
    { label: "Respondent",   audience: "Respondent" },
    { label: "Enumerator",   audience: "Enumerator" },
    { label: "Referrer",     audience: "Referrer" },
    { label: "Stakeholder",  audience: "Stakeholder" },
  ] as const;

  const audienceColor: Record<string, string> = {
    Respondent:  "#E0195F",
    Enumerator:  "#7C3AED",
    Referrer:    "#059669",
    Stakeholder: "#18181B",
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Email notifications"
        sub="Previews of the transactional emails the system sends to respondents, enumerators, referrers, and stakeholders."
      />

      <div className="flex gap-5 flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="flex-none lg:w-[230px] space-y-4">
          {sections.map(({ label, audience }) => {
            const items = defs.filter((d) => d.audience === audience);
            if (items.length === 0) return null;
            return (
              <div key={audience}>
                <div
                  className="mb-1.5 flex items-center gap-1.5 px-2 text-[10.5px] font-bold uppercase tracking-[0.8px]"
                  style={{ color: audienceColor[audience] }}
                >
                  <span className="h-1.5 w-1.5 rounded-full flex-none" style={{ background: audienceColor[audience] }} />
                  {label}
                </div>
                {items.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => actions.setEmail(d.id)}
                    className={cx(
                      "w-full rounded-[10px] px-3 py-2.5 text-left mb-0.5 transition-colors",
                      state.emailSel === d.id
                        ? "bg-[#F7F7F8] border border-[#E4E4E7]"
                        : "hover:bg-[#F7F7F8]",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={cx("flex-1 text-[12.5px] font-semibold", state.emailSel === d.id ? "text-[#18181B]" : "text-gray-700")}>
                        {d.name}
                      </span>
                      {LIVE_EMAIL_IDS.has(d.id) && (
                        <span className="flex-none rounded-full bg-[#DCFCE7] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-[#15803D]">
                          Live
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        {/* Preview panel */}
        {sel && (
          <div className="flex-1 min-w-0 overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white">
            {/* Envelope header */}
            <div className="border-b border-[#F2F2F4] px-6 py-4">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="rounded px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white"
                  style={{ background: audienceColor[sel.audience] ?? "#18181B" }}
                >
                  {sel.audience}
                </span>
                {LIVE_EMAIL_IDS.has(sel.id) ? (
                  <span className="flex items-center gap-1 rounded-full border border-[#BBF7D0] bg-[#DCFCE7] px-2 py-0.5 text-[10.5px] font-bold text-[#15803D]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                    Live — auto-sent by the system
                  </span>
                ) : (
                  <span className="text-[11.5px] text-gray-400">Preview only — not yet wired</span>
                )}
              </div>
              <div className="text-[15px] font-bold text-[#18181B]">{sel.subject}</div>
              <div className="mt-2 space-y-0.5">
                <div className="text-[12px] text-gray-500">
                  <span className="inline-block w-[38px] font-semibold">From</span>{sel.from}
                </div>
                <div className="text-[12px] text-gray-500">
                  <span className="inline-block w-[38px] font-semibold">To</span>
                  {sel.to === "respondent" ? "maria.delacruz@email.com"
                    : sel.to === "enumerator" ? "grace.tan@prodigitality.net"
                    : sel.to === "stakeholder" ? "arianne@prodigitality.net"
                    : sel.to === "referrer" ? "partner@dti.gov.ph"
                    : sel.to}
                </div>
              </div>
            </div>

            {/* Email shell — pixel-matches the real HTML email design */}
            <div className="overflow-y-auto bg-[#F0F0F3] px-6 py-8">
              <div className="mx-auto w-full max-w-[540px]">
                {/* Card */}
                <div className="overflow-hidden rounded-2xl bg-white" style={{ boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
                  {/* Accent top bar */}
                  <div className="h-[5px] w-full" style={{ background: sel.accent }} />

                  {/* Logo row — left-aligned, matching the real email header */}
                  <div className="flex items-center gap-2.5 px-8 pb-0 pt-6">
                    <LogoMark size={28} gradientId={"email-logo-" + sel.id} />
                    <span className="text-[14px] font-extrabold tracking-[-0.3px] text-[#18181B]">
                      Prodi-Surveys
                    </span>
                  </div>

                  {/* Body blocks */}
                  <div className="space-y-4 px-8 pb-2 pt-5">
                    {sel.blocks.map((b, i) => {
                      const vars = sel.vars ?? {};
                      const dyn = (t: string) => renderDynamic(t, vars, sel.accent);

                      if (b.type === "h") return (
                        <h2 key={i} className="text-[21px] font-extrabold leading-[1.3] text-[#18181B]">
                          {b.text && dyn(b.text)}
                        </h2>
                      );
                      if (b.type === "p") return (
                        <p key={i} className="text-[13.5px] leading-[1.7]" style={{ color: sel.accent }}>
                          {b.text && dyn(b.text)}
                        </p>
                      );
                      if (b.type === "code") return (
                        <div key={i} className="rounded-xl bg-[#F5F5F7] px-6 py-5 text-center">
                          <span className="font-mono text-[32px] font-extrabold tracking-[8px] text-[#18181B]">
                            {b.text && dyn(b.text)}
                          </span>
                        </div>
                      );
                      if (b.type === "btn") return (
                        <div key={i} className="pt-1">
                          <span
                            className="inline-block rounded-[10px] px-6 py-3 text-[13.5px] font-bold text-white"
                            style={{ background: sel.accent }}
                          >
                            {b.text}
                          </span>
                        </div>
                      );
                      if (b.type === "linkbox") return (
                        <div key={i} className="rounded-[9px] border border-[#E4E4E7] bg-[#F7F7F8] px-4 py-3">
                          <span className="break-all font-mono text-[12px] text-[#4F46E5]">
                            {b.text && dyn(b.text)}
                          </span>
                        </div>
                      );
                      if (b.type === "kv" && b.rows) return (
                        <div key={i} className="overflow-hidden rounded-[10px] border border-[#EBEBED]">
                          {b.rows.map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between border-b border-[#F5F5F7] px-4 py-[11px] last:border-0 text-[12.5px]">
                              <span className="text-[#9CA3AF]">{k}</span>
                              <span className="font-bold text-[#18181B]">{dyn(v)}</span>
                            </div>
                          ))}
                        </div>
                      );
                      if (b.type === "bullets" && b.items) return (
                        <ul key={i} className="space-y-1.5 pl-0">
                          {b.items.map((item, j) => (
                            <li key={j} className="flex items-start gap-2 text-[13.5px] leading-[1.65]" style={{ color: sel.accent }}>
                              <span className="mt-[7px] h-[5px] w-[5px] flex-none rounded-full" style={{ background: sel.accent }} />
                              {dyn(item)}
                            </li>
                          ))}
                        </ul>
                      );
                      if (b.type === "note") return (
                        <p key={i} className="text-[12px] leading-[1.65] text-[#9CA3AF]">
                          {b.text && dyn(b.text)}
                        </p>
                      );
                      if (b.type === "divider") return (
                        <hr key={i} className="border-[#F2F2F4]" />
                      );
                      return null;
                    })}
                  </div>

                  {/* Footer — thin border + two lines, no bg change */}
                  <div className="mt-4 border-t border-[#F2F2F4] px-8 py-5">
                    <p className="text-[11px] leading-[1.7] text-[#9CA3AF]">
                      <span className="text-[#6B7280]">Prodigitality</span>
                      {" · "}
                      <span className="text-[#4F46E5]">prodigitalitydata.live</span>
                    </p>
                    <p className="text-[11px] leading-[1.7] text-[#9CA3AF]">
                      {"You received this email because you registered for or were added to the "}
                      <span className="text-[#4F46E5]">Prodigitality</span>
                      {" baseline survey."}
                    </p>
                  </div>
                </div>

                {/* Preheader — sits below the card */}
                {sel.preheader && (
                  <p className="mt-3 text-center text-[11px] text-[#ADADB8]">{sel.preheader}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Audit log ───────────────────────────────────────────────────────────────

function AuditView() {
  const { state } = usePortal();
  return (
    <div className="space-y-4">
      <PageHeader title="Audit log" sub="Every important action is recorded for traceability." />
      <div className="overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white">
        {state.audit.length === 0 ? (
          <div className="py-14 text-center text-[13.5px] text-gray-400">No audit entries yet.</div>
        ) : (
          state.audit.map((entry, i) => (
            <div key={i} className="flex items-start gap-3 border-b border-[#F5F5F7] px-5 py-3.5 last:border-0">
              <div
                className="mt-[3px] flex h-7 w-7 flex-none items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: entry[4], color: entry[5] }}
              >
                ·
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-gray-800">
                  {entry[0]} <span className="font-normal text-gray-400">—</span> <span className="text-gray-600">{entry[1]}</span>
                </div>
                <div className="text-[11.5px] text-gray-400">by {entry[2]}</div>
              </div>
              <div className="flex-none text-[11.5px] text-gray-400">{entry[3]}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────

function SettingsView() {
  const { state, actions } = usePortal();
  const types   = ["TSI", "AgriTech", "SME"] as const;
  const typeNames = { TSI: "Trade Support Institutions (TSI)", AgriTech: "Agri-Tech Providers (AFTP)", SME: "Food Processing SMEs" };
  const typeShortNames = { TSI: "Trade Support Institutions", AgriTech: "Agri-Tech Providers (AFTP)", SME: "Food Processing SMEs" };
  const totalTarget = types.reduce((s, t) => s + (Number(state.draftTargets[t]) || 0), 0);

  return (
    <div className="max-w-[760px] space-y-5">
      <PageHeader title="Settings" sub="Targets, incentive structure & survey paths." />

      {/* Target respondents */}
      <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[14px] font-bold text-[#18181B]">Target respondents per path</span>
          <span className="text-[13px] font-semibold text-gray-500">Total target: {totalTarget}</span>
        </div>
        <div className="space-y-3">
          {types.map((t) => (
            <div key={t} className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <span
                  className="h-2.5 w-2.5 rounded-full flex-none"
                  style={{ background: t === "TSI" ? "#7C3AED" : t === "AgriTech" ? "#059669" : "#E0195F" }}
                />
                <span className="text-[13px] font-semibold text-gray-700">{typeNames[t]}</span>
              </div>
              <input
                type="number"
                min={0}
                value={state.draftTargets[t]}
                onChange={(e) => actions.setTarget(t, e.target.value)}
                className="h-9 w-20 rounded-[8px] border border-[#E4E4E7] bg-[#F7F7F8] px-3 text-[14px] font-semibold text-center focus:border-[#18181B] focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Token & referral structure */}
      <div className="rounded-2xl border border-[#E4E4E7] bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F2F2F4] flex items-center justify-between">
          <span className="text-[14px] font-bold text-[#18181B]">Token & referral structure</span>
          <span className="text-[12px] text-gray-400">Amounts in ₱ · editable</span>
        </div>
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-[#F2F2F4]">
              {["GROUP", "RESPONDENT TOKEN", "REFERRAL BONUS", "TOTAL / VERIFIED"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.5px] text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {types.map((t) => {
              const total = (state.draftIncentives[t]?.token || 0) + (state.draftIncentives[t]?.bonus || 0);
              return (
                <tr key={t} className="border-b border-[#F5F5F7] last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full flex-none" style={{ background: t === "TSI" ? "#7C3AED" : t === "AgriTech" ? "#059669" : "#E0195F" }} />
                      <span className="text-[12.5px] font-semibold text-gray-700">{typeShortNames[t]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] text-gray-400">₱</span>
                      <input
                        type="number"
                        min={0}
                        value={state.draftIncentives[t]?.token ?? 0}
                        onChange={(e) => actions.setIncentive(t, "token", e.target.value)}
                        className="h-8 w-20 rounded-[8px] border border-[#E4E4E7] bg-[#F7F7F8] px-2 text-[13px] font-semibold focus:border-[#18181B] focus:outline-none"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] text-gray-400">₱</span>
                      <input
                        type="number"
                        min={0}
                        value={state.draftIncentives[t]?.bonus ?? 0}
                        onChange={(e) => actions.setIncentive(t, "bonus", e.target.value)}
                        className="h-8 w-20 rounded-[8px] border border-[#E4E4E7] bg-[#F7F7F8] px-2 text-[13px] font-semibold focus:border-[#18181B] focus:outline-none"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold text-[#18181B]">
                    {peso(total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Survey paths */}
      <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6">
        <div className="mb-4 text-[14px] font-bold text-[#18181B]">Survey paths</div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "TSI survey",         q: 15, color: "#7C3AED" },
            { label: "Agri-Tech (AFTP) survey", q: 16, color: "#059669" },
            { label: "SME survey",         q: 19, color: "#E0195F" },
          ].map((p) => (
            <div key={p.label} className="rounded-[12px] border border-[#E4E4E7] p-4">
              <div className="mb-0.5 text-[13px] font-bold text-[#18181B]">{p.label}</div>
              <div className="mb-3 text-[11.5px] text-gray-400">{p.q} questions · conditional logic</div>
              <span className="rounded-md px-2 py-0.5 text-[11.5px] font-bold text-emerald-700 bg-emerald-50">Active</span>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 rounded-2xl border border-[#E4E4E7] bg-white p-4">
        {state.role === "admin" && (
          <>
            <span className="flex-1 text-[12.5px] text-emerald-700 font-semibold">All changes saved.</span>
            <button
              onClick={actions.askSaveSettings}
              className="rounded-[9px] bg-[#18181B] px-5 py-2.5 text-[12.5px] font-bold text-white"
            >
              Save changes
            </button>
          </>
        )}
      </div>

      {/* Confirm dialog */}
      {state.confirmSave && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-5">
          <div className="w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-2 text-[17px] font-extrabold">Save settings?</h2>
            <p className="mb-5 text-[13px] text-gray-500">
              This will update targets and incentive amounts for all future respondents.
            </p>
            <div className="flex gap-2.5">
              <button onClick={actions.cancelSaveSettings} className="flex-1 rounded-[10px] border border-[#E4E4E7] py-2.5 text-[13.5px] font-semibold text-gray-600">
                Cancel
              </button>
              <button onClick={actions.confirmSaveSettings} className="flex-1 rounded-[10px] bg-[#18181B] py-2.5 text-[13.5px] font-bold text-white">
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
  const router = useRouter();
  const pathname = usePathname();
  const activeView = pathname.split("/").filter(Boolean).pop();
  const onPayoutsView = activeView === "payouts";
  const r = state.respondents.find((x) => x.id === state.selectedId);
  if (!r) return null;

  const bonusAmt  = r.verified && r.referred ? bon(state.incentives, r.type) : 0;
  const tokenAmt  = tok(state.incentives, r.type);
  const isAdmin   = state.role === "admin";
  const snapshot  = r.snapshot ?? [];

  const checks = [
    { label: "Email verified",        ok: r.emailV,     note: null },
    { label: "Survey completed",      ok: r.surveyDone, note: null },
    { label: "Selfie submitted",      ok: r.selfie,     note: null },
    { label: "Email unique",          ok: !r.flags.includes("Duplicate email"),   note: r.flags.includes("Duplicate email")   ? "match found" : "no match" },
    { label: "Mobile unique",         ok: !r.flags.includes("Duplicate mobile"),  note: r.flags.includes("Duplicate mobile")  ? "match found" : "no match" },
    { label: "No prior payout",        ok: !r.flags.includes("Duplicate payout"),  note: r.flags.includes("Duplicate payout")  ? "prior found" : "no prior found" },
  ];

  const onQaView = activeView === "qa";
  // QA actions live on the QA Review page only. The Approve/Reject buttons show
  // in the drawer there; everywhere else it links over to QA Review instead.
  const qaActionable   = isAdmin && (r.status === "Pending QA" || r.status === "Needs Follow-up");
  const showQaActions  = qaActionable && onQaView;
  const showGoToQa     = qaActionable && !onQaView;
  // Payout actions live on the Payouts page only. On the Payouts view the drawer
  // keeps the quick "Mark as paid"; everywhere else (Respondents/QA) it shows a
  // link to the Payouts page instead so payouts are managed in one place.
  const payoutPending  = isAdmin && r.verified && r.payStatus === "Pending";
  const showMarkPaid   = payoutPending && onPayoutsView;
  const showGoToPayouts = payoutPending && !onPayoutsView;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={actions.closeProfile} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col bg-white shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 border-b border-[#E4E4E7] px-5 py-4">
          <div
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-[13px] font-extrabold text-white"
            style={{ background: avatarColor(r.name) }}
          >
            {initials(r.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-extrabold text-[#18181B]">{r.name}</span>
              {typeBadge(r.type)}
            </div>
            <div className="mt-0.5 text-[12.5px] text-gray-500">{r.org}</div>
          </div>
          <button onClick={actions.closeProfile} className="flex-none p-1 text-gray-400 hover:text-gray-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Status row */}
          <div className="flex items-center gap-2.5 border-b border-[#F5F5F7] px-5 py-3">
            {statusBadge(r.status)}
            <span className="text-[12px] text-gray-400">Registered {r.createdDays}d ago</span>
          </div>

          {/* Verification checklist */}
          <div className="px-5 pb-3 pt-4">
            <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.6px] text-gray-400">
              Verification Checklist
            </div>
            <div className="space-y-2">
              {checks.map(({ label, ok, note }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <span className={cx(
                    "flex h-5 w-5 flex-none items-center justify-center rounded-full",
                    ok ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400",
                  )}>
                    {ok
                      ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    }
                  </span>
                  <span className="flex-1 text-[13px] text-[#18181B]">{label}</span>
                  {note && <span className="text-[11.5px] text-gray-400">{note}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Contact / info grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-[#F5F5F7] px-5 py-4">
            {([
              ["EMAIL",         r.email],
              ["MOBILE",        r.mobile || "—"],
              ["REGION",        r.region || "—"],
              ["POSITION",      r.position && r.position !== "—" ? r.position : null],
              ["MODE",          r.mode],
              ["ENUMERATOR",    r.enumerator && r.enumerator !== "—" ? r.enumerator : null],
              ["REFERRAL CODE", r.code || "—"],
              ["REFERRED BY",   r.referredBy || null],
            ] as [string, string | null][]).filter(([, v]) => v !== null).map(([label, value]) => (
              <div key={label}>
                <div className="text-[10.5px] font-bold uppercase tracking-[0.5px] text-gray-400">{label}</div>
                <div className="mt-0.5 break-all text-[12.5px] font-semibold text-[#18181B]">{value}</div>
              </div>
            ))}
          </div>

          {/* Selfie verification */}
          <div className="border-t border-[#F5F5F7] px-5 py-4">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.6px] text-gray-400">
              Selfie Verification
            </div>
            {r.selfie ? (
              <div className="flex gap-3">
                {r.selfieUrl ? (
                  <a href={r.selfieUrl} target="_blank" rel="noreferrer" className="flex-none">
                    <img
                      src={r.selfieUrl}
                      alt="Identity selfie"
                      className="h-[88px] w-[72px] rounded-[10px] object-cover ring-1 ring-black/10 transition hover:opacity-90"
                    />
                  </a>
                ) : (
                  <div className="flex h-[88px] w-[72px] flex-none items-center justify-center rounded-[10px] bg-gray-100">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                )}
                <div className="space-y-1 pt-0.5">
                  <div className="text-[12.5px] font-semibold text-[#18181B]">Submitted</div>
                  <div className="text-[12px] text-gray-400">{r.createdDays}d ago</div>
                  {r.selfieUrl && (
                    <a
                      href={r.selfieUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-[11.5px] font-semibold text-[#4F46E5] hover:underline"
                    >
                      Open full size ↗
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="flex h-[88px] w-[72px] flex-none items-center justify-center rounded-[10px] bg-gray-100">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="pt-0.5 text-[12.5px] text-gray-400">Not submitted</div>
              </div>
            )}
          </div>

          {/* Survey snapshot */}
          {snapshot.length > 0 && (
            <div className="border-t border-[#F5F5F7] px-5 py-4">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.6px] text-gray-400">
                Survey Snapshot · {r.type} Path
              </div>
              <div className="space-y-3">
                {snapshot.map(([q, a]) => (
                  <div key={q}>
                    <div className="text-[12px] text-gray-400">{q}</div>
                    <div className="mt-0.5 text-[13px] font-semibold text-[#18181B]">{a}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payout — admin only */}
          {isAdmin && (
            <div className="border-t border-[#F5F5F7] px-5 py-4">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.6px] text-gray-400">
                Payout · <span className="text-[#E0195F]">Admin Only</span>
              </div>
              <div className="space-y-2.5">
                {([
                  ["Respondent token", r.type === "TSI" ? "Tumbler giveaway" : peso(tokenAmt)],
                  ["Referral bonus",   bonusAmt > 0 ? peso(bonusAmt) : "Not eligible"],
                  ["Method",          r.method && r.method !== "—" ? `${r.method}${r.acct && r.acct !== "—" ? " " + r.acct : ""}`.trim() : "—"],
                  ["Payout status",   r.payStatus || "—"],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[12.5px] text-gray-500">{label}</span>
                    <span className="text-[12.5px] font-semibold text-[#18181B]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flags */}
          {r.flags && r.flags.length > 0 && (
            <div className="border-t border-[#F5F5F7] mx-5 my-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
              <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.5px] text-red-700">⚑ Flags</div>
              {r.flags.map((f) => (
                <div key={f} className="text-[12.5px] text-red-600">{f}</div>
              ))}
            </div>
          )}

          <div className="h-4" />
        </div>

        {/* ── Sticky footer ── */}
        {showQaActions && (
          <div className="border-t border-[#E4E4E7] p-4">
            <div className="flex gap-2">
              <button
                onClick={() => actions.qaAct(r.id, "approve")}
                className="flex-1 rounded-[9px] bg-emerald-600 py-2.5 text-[13px] font-bold text-white hover:bg-emerald-700"
              >
                ✓ Approve
              </button>
              <button
                onClick={() => actions.qaAct(r.id, "reject")}
                className="flex-1 rounded-[9px] border border-red-200 py-2.5 text-[13px] font-bold text-red-600 hover:bg-red-50"
              >
                ✕ Reject
              </button>
            </div>
          </div>
        )}

        {showGoToQa && (
          <div className="border-t border-[#E4E4E7] p-4">
            <button
              onClick={() => router.push(`/portal/${state.role}/qa`)}
              className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#18181B] py-3 text-[13.5px] font-bold text-white hover:bg-black"
            >
              Manage in QA Review
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        )}

        {showMarkPaid && (
          <div className="border-t border-[#E4E4E7] p-4">
            <button
              onClick={() => actions.markPaid(r.id)}
              className="w-full rounded-[10px] bg-emerald-600 py-3 text-[13.5px] font-bold text-white hover:bg-emerald-700"
            >
              Mark as paid · {r.type === "TSI" ? "Tumbler" : peso(tokenAmt)}
            </button>
          </div>
        )}

        {showGoToPayouts && (
          <div className="border-t border-[#E4E4E7] p-4">
            <button
              onClick={() => router.push(`/portal/${state.role}/payouts`)}
              className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#18181B] py-3 text-[13.5px] font-bold text-white hover:bg-black"
            >
              Manage payout in Payouts
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
