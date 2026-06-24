// Single source of truth for mapping a raw Supabase submissions row → Respondent.
// Imported by both the portal server component and the portal API route.

import { avatarColor } from "./format";
import { surveyDef } from "./survey";
import type { CollectionMode, Respondent } from "./types";

// Builds the QA drawer's "Survey Snapshot" from the respondent's actual answers.
// Walks the survey instrument for the path so every answered question is shown
// with its real label (skips section headers and open-ended text questions).
function buildSnapshot(
  surveyType: string,
  answers: Record<string, unknown>,
): [string, string][] {
  if (!answers || Object.keys(answers).length === 0) return [];
  const out: [string, string][] = [];
  for (const q of surveyDef(surveyType)) {
    if (q.kind === "section" || q.kind === "text" || !q.id || !q.label) continue;
    const raw = answers[q.id];
    const text = answerToText(raw);
    if (text) out.push([q.label, text]);
  }
  return out;
}

// Renders a stored answer value (string | string[] | matrix object) as text.
function answerToText(raw: unknown): string | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const items = raw.filter(Boolean).map(String);
    return items.length ? items.join(", ") : null;
  }
  if (typeof raw === "object") {
    const parts = Object.entries(raw as Record<string, unknown>)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`);
    return parts.length ? parts.join(" · ") : null;
  }
  const s = String(raw).trim();
  return s ? s : null;
}

// Default incentive amounts — kept in sync with the store's initial incentives.
const DEFAULT_TOKEN: Record<string, number> = { SME: 200, AgriTech: 300, TSI: 0 };
const DEFAULT_BONUS: Record<string, number> = { SME: 100, AgriTech: 1000, TSI: 0 };

const PAYOUT_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
  on_hold: "On Hold",
};

const SUBMISSION_STATUS_LABEL: Record<string, string> = {
  submitted: "Pending QA",
  verified: "Verified",
  rejected: "Rejected",
  follow_up: "Needs Follow-up",
};

export function rowToRespondent(
  row: Record<string, unknown>,
  idx: number,
): Respondent {
  const reg = (row.registration as Record<string, string>) ?? {};
  const qual = (row.qualification as Record<string, string>) ?? {};
  const answers = (row.answers as Record<string, string>) ?? {};
  const pay = (row.payout_details as Record<string, string> | null) ?? null;
  const ship = (row.shipping_details as Record<string, string> | null) ?? null;
  const rawStatus = (row.status as string) ?? "submitted";
  const surveyType = (row.survey_type as string) ?? "SME";
  const name = reg.name ?? "—";
  const verified = rawStatus === "verified";
  const referred = Boolean(row.referrer_code);

  // payout_status column (migration 004); fall back to deriving from QA status.
  let payStatus = "—";
  if (row.payout_status) {
    payStatus = PAYOUT_STATUS_LABEL[row.payout_status as string] ?? (row.payout_status as string);
  } else if (verified) {
    payStatus = "Pending";
  }

  // referrer_payout_status column (migration 013) — the referral-bonus payout,
  // tracked independently of the respondent's own token. Defaults to Pending for
  // any verified+referred respondent that hasn't been actioned yet.
  let referrerPayStatus = "—";
  if (row.referrer_payout_status) {
    referrerPayStatus =
      PAYOUT_STATUS_LABEL[row.referrer_payout_status as string] ?? (row.referrer_payout_status as string);
  } else if (verified && referred) {
    referrerPayStatus = "Pending";
  }

  // paid_at → display date used by the portal's "Mark paid" confirmation.
  const paidDate = row.paid_at
    ? new Date(row.paid_at as string).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      })
    : "";

  // Token & bonus amounts use the hardcoded defaults (Settings page can
  // override in the store, but DB rows don't store the amount per-record yet).
  const token = DEFAULT_TOKEN[surveyType] ?? 0;
  const bonus = verified && referred ? (DEFAULT_BONUS[surveyType] ?? 0) : 0;

  // Payout method label. `acct` is the masked account only — callers prepend the
  // method (so it must not embed the method, or it renders e.g. "GCash GCash ••••").
  let method = "—";
  let acct = "—";
  if (pay) {
    method = pay.method ?? "—";
    acct = pay.acctNum ? `•••• ${String(pay.acctNum).slice(-3)}` : "—";
  } else if (ship) {
    const colorLabels: Record<string, string> = { grey: "Charcoal grey", blue: "Sky blue", black: "Black" };
    method = "Tumbler · " + (colorLabels[ship.color] ?? ship.color ?? "Grey");
    acct = "—";
  }

  // Age in days from created_at
  const createdAt = row.created_at ? new Date(row.created_at as string) : null;
  const createdDays = createdAt
    ? Math.floor((Date.now() - createdAt.getTime()) / 86_400_000)
    : 0;

  // mode and enumerator are stored in registration when submitted via
  // enumerator-assisted flow. Default to Self-service if absent.
  const mode: CollectionMode =
    reg.mode === "Enumerator-assisted" ? "Enumerator-assisted" : "Self-service";
  const enumerator = reg.enumerator ?? "—";

  return {
    id: idx + 1,
    supabaseId: row.id as string,
    name,
    org: reg.org ?? "—",
    type: surveyType as Respondent["type"],
    status: SUBMISSION_STATUS_LABEL[rawStatus] ?? rawStatus,
    region: reg.region ?? "—",
    position: answers.a_position ?? reg.position ?? "—",
    email: reg.email ?? "",
    mobile: reg.mobile ?? "",
    emailV: true,
    surveyDone: true,
    selfie: Boolean(row.selfie_url),
    selfieUrl: (row.selfie_url as string | null) ?? undefined,
    verified,
    token,
    bonus,
    referred,
    referrer: (row.referrer_code as string | null) ?? null,
    referredBy: qual.refName || (row.referrer_code as string | null) || null,
    mode,
    enumerator,
    payStatus,
    referrerPayStatus,
    method,
    acct,
    // Full payout number (mobile / account / reference) + account name. Both are
    // admin-only — redacted to "" for non-admin viewers in the layout + API route
    // before they reach the client.
    acctNum: pay?.acctNum ? String(pay.acctNum) : "",
    acctName: pay?.acctName ? String(pay.acctName) : "",
    compMin: 0,
    flags: [],
    code: reg.generated_referral_code ?? "",
    snapshot: buildSnapshot(surveyType, answers),
    answers,
    createdDays,
    submittedAt: createdAt ? createdAt.toISOString() : "",
    color: avatarColor(name),
    payoutOn: Boolean(pay),
    // Pass paidDate through as a custom field so the Payouts view can display it.
    ...(paidDate ? { _paidDate: paidDate } : {}),
  } as Respondent;
}

// Maps a raw rows array to Respondents with cross-row duplicate flags injected.
// Use this instead of calling rowToRespondent individually so duplicate detection
// always runs in both the server layout and the API route.
export function rowsToRespondents(rows: Record<string, unknown>[]): Respondent[] {
  // Pass 1 — build duplicate-detection maps.
  const emailMap   = new Map<string, number>(); // all submissions
  const mobileMap  = new Map<string, number>(); // all submissions
  const payoutMap  = new Map<string, number>(); // non-rejected submissions (payout risk)

  for (const row of rows) {
    const reg    = (row.registration as Record<string, string>) ?? {};
    const email  = (reg.email  ?? "").toLowerCase().trim();
    const mobile = (reg.mobile ?? "").trim();
    const status = (row.status as string) ?? "";

    if (email)  emailMap.set(email,   (emailMap.get(email)   ?? 0) + 1);
    if (mobile) mobileMap.set(mobile, (mobileMap.get(mobile) ?? 0) + 1);
    // Count non-rejected submissions per email — more than one means the same
    // person could receive multiple payouts if all are approved.
    if (email && status !== "rejected") {
      payoutMap.set(email, (payoutMap.get(email) ?? 0) + 1);
    }
  }

  // Pass 2 — map rows and inject duplicate flags.
  return rows.map((row, i) => {
    const r      = rowToRespondent(row, i);
    const reg    = (row.registration as Record<string, string>) ?? {};
    const email  = (reg.email  ?? "").toLowerCase().trim();
    const mobile = (reg.mobile ?? "").trim();

    const flags: string[] = [];
    if (email  && (emailMap.get(email)   ?? 0) > 1) flags.push("Duplicate email");
    if (mobile && (mobileMap.get(mobile) ?? 0) > 1) flags.push("Duplicate mobile");
    if (email  && (payoutMap.get(email)  ?? 0) > 1) flags.push("Duplicate payout");

    return flags.length ? { ...r, flags } : r;
  });
}
