// Pure derived-data selectors ported from the prototype's `renderVals()`.
// Each takes the relevant slice of state and returns view-model data; the
// React components stay declarative.

import { colorPick } from "./format";
import type {
  Respondent,
  Role,
  Targets,
} from "./types";

// Flat enumerator payout per verified ("successful") survey. Admin-configurable
// in Settings; this is the default.
export const DEFAULT_SURVEY_PAYOUT = 400;

// Cash token paid to a respondent on the SME / Agri-Tech paths (₱). TSI
// respondents receive a tumbler instead. Admin-configurable in Settings.
export const DEFAULT_RESPONDENT_TOKEN = 200;

export const PROFILE_STAGES = [
  "Survey Started",
  "Survey Completed",
  "Selfie Submitted",
  "Pending QA",
  "Needs Follow-up",
  "Verified",
  "Rejected",
];
const IN_PROGRESS = ["Survey Started", "Survey Completed", "Selfie Submitted", "Email Verified"];

// The ₱400 an enumerator earns for a survey: payable once the survey is verified.
export const payoutFor = (payout: number, r: Respondent) =>
  r.verified ? payout : 0;

export interface Counts {
  registered: number;
  emailV: number;
  surveyDone: number;
  selfieN: number;
  verified: number;
  rejected: number;
  pendingQa: number;
  followup: number;
  flagged: number;
}

export function counts(all: Respondent[]): Counts {
  const cnt = (st: string) => all.filter((r) => r.status === st).length;
  return {
    registered: all.length,
    emailV: all.filter((r) => r.emailV).length,
    surveyDone: all.filter((r) => r.surveyDone).length,
    selfieN: all.filter((r) => r.selfie).length,
    verified: cnt("Verified"),
    rejected: cnt("Rejected"),
    pendingQa: cnt("Pending QA"),
    followup: cnt("Needs Follow-up"),
    flagged: all.filter((r) => r.flags.length > 0).length,
  };
}

export function totals(targets: Targets, verified: number) {
  const totalTarget = targets.TSI + targets.AgriTech + targets.SME;
  const remaining = Math.max(0, totalTarget - verified);
  const overallPct = totalTarget ? Math.round((verified / totalTarget) * 100) : 0;
  return { totalTarget, remaining, overallPct };
}

export interface GroupProgress {
  label: string;
  target: number;
  color: string;
  verified: number;
  pendingQa: number;
  inProgress: number;
  pct: number;
}

export function groups(all: Respondent[], targets: Targets): GroupProgress[] {
  const grp = (
    type: Respondent["type"],
    target: number,
    color: string,
    label: string,
  ): GroupProgress => {
    const g = all.filter((r) => r.type === type);
    const v = g.filter((r) => r.verified).length;
    return {
      label,
      target,
      color,
      verified: v,
      pendingQa: g.filter((r) => r.status === "Pending QA").length,
      inProgress: g.filter((r) => IN_PROGRESS.includes(r.status as string)).length,
      pct: Math.min(100, (v / target) * 100),
    };
  };
  return [
    grp("TSI", targets.TSI, "#7C3AED", "Trade Support Institutions"),
    grp("AgriTech", targets.AgriTech, "#059669", "Agri-Tech Providers"),
    grp("SME", targets.SME, "#E0195F", "Food Processing SMEs"),
  ];
}

// Per-group stage breakdown for the detailed "Progress by respondent group" report.
export interface GroupBreakdown {
  type: Respondent["type"];
  label: string;
  color: string;
  target: number;
  pct: number;
  registered: number;
  emailV: number;
  surveyDone: number;
  selfie: number;
  verified: number;
  pendingQa: number;
  rejected: number;
}

export function groupBreakdown(all: Respondent[], targets: Targets): GroupBreakdown[] {
  const row = (
    type: Respondent["type"],
    target: number,
    color: string,
    label: string,
  ): GroupBreakdown => {
    const g = all.filter((r) => r.type === type);
    const verified = g.filter((r) => r.verified).length;
    return {
      type,
      label,
      color,
      target,
      pct: target ? Math.min(100, Math.round((verified / target) * 100)) : 0,
      registered: g.length,
      emailV: g.filter((r) => r.emailV).length,
      surveyDone: g.filter((r) => r.surveyDone).length,
      selfie: g.filter((r) => r.selfie).length,
      verified,
      pendingQa: g.filter((r) => r.status === "Pending QA").length,
      rejected: g.filter((r) => r.status === "Rejected").length,
    };
  };
  return [
    row("TSI", targets.TSI, "#7C3AED", "Trade Support Institutions"),
    row("AgriTech", targets.AgriTech, "#059669", "Agri-Tech Providers"),
    row("SME", targets.SME, "#E0195F", "Food Processing SMEs"),
  ];
}

export interface FunnelStep {
  label: string;
  value: number;
  pct: number;
}

// Detailed funnel: each stage with its share of registered (pctOfTotal) and the
// step-to-step conversion vs the previous stage (stepPct). Built on funnel().
export interface FunnelDetailStep extends FunnelStep {
  pctOfTotal: number;
  stepPct: number;
}

export function funnelDetail(
  all: Respondent[],
  c: Counts,
  totalTarget = 114,
): FunnelDetailStep[] {
  const steps = funnel(all, c, totalTarget);
  const registered = steps[0]?.value || 0;
  return steps.map((s, i) => {
    const prev = i === 0 ? s.value : steps[i - 1].value;
    return {
      ...s,
      pctOfTotal: registered ? Math.round((s.value / registered) * 100) : 0,
      stepPct: prev ? Math.round((s.value / prev) * 100) : 0,
    };
  });
}

export function funnel(all: Respondent[], c: Counts, totalTarget = 114): FunnelStep[] {
  const profileDone = all.filter((r) => PROFILE_STAGES.includes(r.status as string)).length;
  const flaggedProfile = all.filter(
    (r) =>
      PROFILE_STAGES.includes(r.status as string) &&
      ((r.flags && r.flags.length > 0) ||
        r.qualStatus === "Needs Review" ||
        r.qualStatus === "Not Qualified"),
  ).length;
  const qualifiedN = profileDone - flaggedProfile;
  const paidN = all.filter((r) => r.payStatus === "Paid").length;
  const max = totalTarget || 1;
  return (
    [
      ["Registered", c.registered],
      ["Email verified", c.emailV],
      ["Profile completed", profileDone],
      ["Qualified", qualifiedN],
      ["Survey completed", c.surveyDone],
      ["Selfie submitted", c.selfieN],
      ["Pending QA", c.pendingQa],
      ["Verified", c.verified],
      ["Paid", paidN],
    ] as [string, number][]
  ).map(([label, value]) => ({ label, value, pct: Math.min(100, Math.round((value / max) * 100)) }));
}

export interface ReferrerVM {
  name: string;
  kind: string;
  referred: number;
  verified: number;
  initials: string;
  avatarBg: string;
  code: string;
  convLabel: string;
}

// Referral attribution only — referrals no longer carry any bonus money.
export function referrers(
  all: Respondent[],
  manual: { name: string; kind: string }[],
  codeOf: (n: number) => string,
  hashOf: (s: string) => number,
  initialsOf: (n: string) => string,
): ReferrerVM[] {
  const refMap: Record<
    string,
    { name: string; referred: number; verified: number; kind: string }
  > = {};
  manual.forEach((m) => {
    refMap[m.name] = { name: m.name, referred: 0, verified: 0, kind: m.kind || "Partner / TSI" };
  });
  all.forEach((r) => {
    if (!r.referrer) return;
    const k = r.referrer;
    refMap[k] =
      refMap[k] ||
      { name: k, referred: 0, verified: 0, kind: ["DTI", "Philexport", "DOST"].includes(k) ? "Partner / TSI" : "Respondent" };
    refMap[k].referred++;
    if (r.verified) refMap[k].verified++;
  });
  return Object.values(refMap)
    .sort((a, b) => b.verified - a.verified || b.referred - a.referred)
    .slice(0, 12)
    .map((r) => ({
      ...r,
      initials: initialsOf(r.name).toUpperCase(),
      avatarBg: colorPick(r.name),
      code: "PS-" + codeOf(hashOf(r.name)),
      convLabel: r.referred ? Math.round((r.verified / r.referred) * 100) + "%" : "—",
    }));
}

export interface Tile {
  label: string;
  value: string | number;
}

export function refTiles(all: Respondent[]): Tile[] {
  const totalReferrals = all.filter((r) => r.referrer).length;
  const verifiedRef = all.filter((r) => r.referrer && r.verified).length;
  return [
    { label: "Total referrals", value: totalReferrals },
    { label: "Verified referrals", value: verifiedRef },
    {
      label: "Conversion rate",
      value: totalReferrals ? Math.round((verifiedRef / totalReferrals) * 100) + "%" : "0%",
    },
  ];
}

export interface PayoutTotals {
  pending: number;
  paidTotal: number;
  onHold: number;
}

// Enumerator payouts: a flat `payout` (₱400) per verified survey, tracked per
// survey via payStatus. Respondents and referrers are not paid.
export function payoutTotals(all: Respondent[], payout: number): PayoutTotals {
  const verified = all.filter((r) => r.verified);
  return {
    pending: verified.filter((r) => r.payStatus !== "Paid").length * payout,
    paidTotal: verified.filter((r) => r.payStatus === "Paid").length * payout,
    onHold: verified.filter((r) => r.payStatus === "On Hold").length,
  };
}

export interface EnumPayout {
  name: string;
  initials: string;
  avatarBg: string;
  surveys: number;   // verified surveys credited to this enumerator
  total: number;     // surveys × payout
  paid: number;      // ₱ already marked paid
  pending: number;   // ₱ not yet paid
}

// Per-enumerator payout summary: total owed (verified surveys × ₱400), split
// into paid vs pending. Surveys with no assigned enumerator are grouped as "—".
export function enumPayouts(
  all: Respondent[],
  payout: number,
  initialsOf: (n: string) => string,
): EnumPayout[] {
  const map = new Map<string, { surveys: number; paid: number }>();
  for (const r of all) {
    if (!r.verified) continue;
    const key = r.enumerator && r.enumerator !== "—" ? r.enumerator : "—";
    const cur = map.get(key) ?? { surveys: 0, paid: 0 };
    cur.surveys += 1;
    if (r.payStatus === "Paid") cur.paid += 1;
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .map(([name, v]) => ({
      name,
      initials: initialsOf(name).toUpperCase() || "·",
      avatarBg: colorPick(name || "x"),
      surveys: v.surveys,
      total: v.surveys * payout,
      paid: v.paid * payout,
      pending: (v.surveys - v.paid) * payout,
    }))
    .sort((a, b) => b.total - a.total);
}

// Respondents table filtering (role-aware).
export function filteredRows(
  all: Respondent[],
  role: Role,
  opts: { filterType: string; filterStatus: string; flaggedOnly: boolean; search: string },
): Respondent[] {
  let rows = all;
  // Enumerators see the full respondent list (consistent with their dashboard's
  // global counts), including self-service submissions with no assigned enumerator.
  void role;
  if (opts.filterType !== "all") rows = rows.filter((r) => r.type === opts.filterType);
  if (opts.filterStatus !== "all") rows = rows.filter((r) => r.status === opts.filterStatus);
  if (opts.flaggedOnly) rows = rows.filter((r) => r.flags.length > 0);
  if (opts.search.trim()) {
    const q = opts.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.org.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q),
    );
  }
  return rows;
}

export interface EnumCard {
  name: string;
  email: string;
  initials: string;
  avatarBg: string;
  assigned: number;
  completed: number;
  followups: number;
  rate: number;
}

export function enumCards(
  enumerators: { name: string; email: string }[],
  all: Respondent[],
  initialsOf: (n: string) => string,
): EnumCard[] {
  return enumerators.map((en) => {
    const assigned = all.filter((r) => r.enumerator === en.name);
    const completed = assigned.filter((r) => r.surveyDone).length;
    const rate = assigned.length ? Math.round((completed / assigned.length) * 100) : 0;
    return {
      name: en.name,
      email: en.email || "",
      initials: initialsOf(en.name).toUpperCase() || "·",
      avatarBg: colorPick(en.name || "x"),
      assigned: assigned.length,
      completed,
      followups: assigned.filter((r) => r.status === "Needs Follow-up").length,
      rate,
    };
  });
}
