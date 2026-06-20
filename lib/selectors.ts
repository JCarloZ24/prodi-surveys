// Pure derived-data selectors ported from the prototype's `renderVals()`.
// Each takes the relevant slice of state and returns view-model data; the
// React components stay declarative.

import { colorPick, peso } from "./format";
import type {
  Incentives,
  Respondent,
  Role,
  Targets,
} from "./types";

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

export const tok = (inc: Incentives, t: Respondent["type"]) => inc[t]?.token || 0;
export const bon = (inc: Incentives, t: Respondent["type"]) => inc[t]?.bonus || 0;
export const bonusOf = (inc: Incentives, r: Respondent) =>
  r.verified && r.referred ? bon(inc, r.type) : 0;

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

export interface FunnelStep {
  label: string;
  value: number;
  pct: number;
}

export function funnel(all: Respondent[], c: Counts): FunnelStep[] {
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
  const reg = c.registered || 1;
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
  ).map(([label, value]) => ({ label, value, pct: Math.round((value / reg) * 100) }));
}

export interface ReferrerVM {
  name: string;
  kind: string;
  referred: number;
  verified: number;
  bonus: number;
  initials: string;
  avatarBg: string;
  code: string;
  bonusLabel: string;
  convLabel: string;
}

export function referrers(
  all: Respondent[],
  manual: { name: string; kind: string }[],
  inc: Incentives,
  codeOf: (n: number) => string,
  hashOf: (s: string) => number,
  initialsOf: (n: string) => string,
): ReferrerVM[] {
  const refMap: Record<
    string,
    { name: string; referred: number; verified: number; bonus: number; kind: string }
  > = {};
  manual.forEach((m) => {
    refMap[m.name] = { name: m.name, referred: 0, verified: 0, bonus: 0, kind: m.kind || "Partner / TSI" };
  });
  all.forEach((r) => {
    if (!r.referrer) return;
    const k = r.referrer;
    refMap[k] =
      refMap[k] ||
      { name: k, referred: 0, verified: 0, bonus: 0, kind: ["DTI", "Philexport", "DOST"].includes(k) ? "Partner / TSI" : "Respondent" };
    refMap[k].referred++;
    if (r.verified) {
      refMap[k].verified++;
      refMap[k].bonus += bon(inc, r.type);
    }
  });
  return Object.values(refMap)
    .sort((a, b) => b.verified - a.verified || b.referred - a.referred)
    .slice(0, 12)
    .map((r) => ({
      ...r,
      initials: initialsOf(r.name).toUpperCase(),
      avatarBg: colorPick(r.name),
      code: "PS-" + codeOf(hashOf(r.name)),
      bonusLabel: peso(r.bonus),
      convLabel: r.referred ? Math.round((r.verified / r.referred) * 100) + "%" : "—",
    }));
}

export interface Tile {
  label: string;
  value: string | number;
}

export function refTiles(all: Respondent[], inc: Incentives): Tile[] {
  const totalReferrals = all.filter((r) => r.referrer).length;
  const verifiedRef = all.filter((r) => r.referrer && r.verified).length;
  const pendingBonus = all
    .filter((r) => r.verified && r.referred)
    .reduce((s, r) => s + bon(inc, r.type), 0);
  return [
    { label: "Total referrals", value: totalReferrals },
    { label: "Verified referrals", value: verifiedRef },
    {
      label: "Conversion rate",
      value: totalReferrals ? Math.round((verifiedRef / totalReferrals) * 100) + "%" : "0%",
    },
    { label: "Pending bonuses", value: peso(pendingBonus) },
  ];
}

export interface PayoutTotals {
  tokensPending: number;
  bonusPending: number;
  paidTotal: number;
  onHold: number;
}

export function payoutTotals(all: Respondent[], inc: Incentives): PayoutTotals {
  return {
    tokensPending: all
      .filter((r) => r.verified && r.payStatus !== "Paid")
      .reduce((s, r) => s + tok(inc, r.type), 0),
    bonusPending: all
      .filter((r) => r.verified && r.referred && r.payStatus !== "Paid")
      .reduce((s, r) => s + bon(inc, r.type), 0),
    paidTotal: all
      .filter((r) => r.payStatus === "Paid")
      .reduce((s, r) => s + tok(inc, r.type) + (r.referred ? bon(inc, r.type) : 0), 0),
    onHold: all.filter((r) => r.payStatus === "On Hold").length,
  };
}

// Respondents table filtering (role-aware).
export function filteredRows(
  all: Respondent[],
  role: Role,
  opts: { filterType: string; filterStatus: string; flaggedOnly: boolean; search: string },
): Respondent[] {
  let rows = all;
  if (role === "enumerator") rows = rows.filter((r) => r.enumerator === "Maria Santos");
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
