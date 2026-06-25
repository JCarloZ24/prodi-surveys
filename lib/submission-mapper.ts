// Single source of truth for mapping a raw Supabase submissions row → Respondent.
// Imported by both the portal server component and the portal API route.

import { avatarColor } from "./format";
import type { CollectionMode, Respondent } from "./types";

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
  enumBySlug?: Map<string, string>,
): Respondent {
  const reg = (row.registration_data as Record<string, string>) ?? {};
  const qual = (row.profiles_data as Record<string, string>) ?? {};
  const surveyType = (row.survey_type as string) ?? "SME";
  // token_data is the single generic token column: payout shape for SME/Agri-Tech,
  // tumbler-shipping shape for TSI. Split it back out by survey path.
  const isTSI = surveyType === "TSI";
  const token = (row.token_data as Record<string, string> | null) ?? null;
  const pay = isTSI ? null : token;
  const ship = isTSI ? token : null;
  const rawStatus = (row.status as string) ?? "submitted";
  const name = reg.name ?? "—";
  const verified = rawStatus === "verified";
  const referred = Boolean(row.referrer_code);

  // enumerator_payout_status — the enumerator's flat ₱400 for this survey.
  // Fall back to deriving from QA status (verified → Pending).
  let payStatus = "—";
  if (row.enumerator_payout_status) {
    payStatus = PAYOUT_STATUS_LABEL[row.enumerator_payout_status as string] ?? (row.enumerator_payout_status as string);
  } else if (verified) {
    payStatus = "Pending";
  }

  // enumerator_paid_at → display date used by the portal's "Mark paid" confirmation.
  const paidDate = row.enumerator_paid_at
    ? new Date(row.enumerator_paid_at as string).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      })
    : "";

  // Respondent token payout (₱ cash / tumbler), independent of the enumerator's.
  // Default to "Pending" once verified so the Payouts page can action it.
  let respondentPayStatus = "—";
  if (row.respondent_payout_status) {
    respondentPayStatus =
      PAYOUT_STATUS_LABEL[row.respondent_payout_status as string] ?? (row.respondent_payout_status as string);
  } else if (verified) {
    respondentPayStatus = "Pending";
  }
  const respondentPaidDate = row.respondent_paid_at
    ? new Date(row.respondent_paid_at as string).toLocaleDateString("en-PH", { month: "short", day: "numeric" })
    : "";

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

  // Every survey is enumerator-assisted (respondents come via /s/[slug]). The
  // enumerator is resolved from the submission's enumerator_slug → profile name;
  // fall back to a name stored on the registration, then "—".
  const mode: CollectionMode = "Enumerator-assisted";
  const enumSlug = (row.enumerator_slug as string | null) ?? "";
  const enumerator =
    (enumSlug && enumBySlug?.get(enumSlug)) || reg.enumerator || "—";

  return {
    id: idx + 1,
    supabaseId: row.id as string,
    name,
    org: reg.org ?? "—",
    type: surveyType as Respondent["type"],
    status: SUBMISSION_STATUS_LABEL[rawStatus] ?? rawStatus,
    region: reg.region ?? "—",
    position: reg.position ?? "—",
    email: reg.email ?? "",
    mobile: reg.mobile ?? "",
    emailV: true,
    surveyDone: true,
    selfie: Boolean(row.selfie_url),
    selfieUrl: (row.selfie_url as string | null) ?? undefined,
    verified,
    referred,
    referrer: (row.referrer_code as string | null) ?? null,
    referredBy: qual.refName || (row.referrer_code as string | null) || null,
    mode,
    enumerator,
    payStatus,
    method,
    acct,
    // Full payout number (mobile / account / reference) + account name. Both are
    // admin-only — redacted to "" for non-admin viewers in the layout + API route
    // before they reach the client.
    acctNum: pay?.acctNum ? String(pay.acctNum) : "",
    acctName: pay?.acctName ? String(pay.acctName) : "",
    // Respondent token payout + TSI tumbler shipping (address/phone/recipient are
    // admin-only — redacted for non-admin viewers in the layout/API).
    respondentPayStatus,
    ...(respondentPaidDate ? { respondentPaidDate } : {}),
    tumblerColor: ship?.color ? String(ship.color) : "",
    shipRecipient: ship?.recipientName ? String(ship.recipientName) : "",
    shipPhone: ship?.recipientPhone ? String(ship.recipientPhone) : "",
    shipAddress: ship?.address ? String(ship.address) : "",
    compMin: 0,
    flags: [],
    code: reg.generated_referral_code ?? "",
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
// Build a slug → enumerator-name map from profile rows, for resolving each
// submission's enumerator_slug to a display name.
export function buildEnumSlugMap(
  profiles: { slug: string | null; full_name: string | null }[],
): Map<string, string> {
  const m = new Map<string, string>();
  for (const p of profiles) {
    if (p.slug && p.full_name) m.set(p.slug, p.full_name);
  }
  return m;
}

export function rowsToRespondents(
  rows: Record<string, unknown>[],
  enumBySlug?: Map<string, string>,
): Respondent[] {
  // Pass 1 — build duplicate-detection maps.
  const emailMap   = new Map<string, number>(); // all submissions
  const mobileMap  = new Map<string, number>(); // all submissions
  const payoutMap  = new Map<string, number>(); // non-rejected submissions (payout risk)

  for (const row of rows) {
    const reg    = (row.registration_data as Record<string, string>) ?? {};
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
    const r      = rowToRespondent(row, i, enumBySlug);
    const reg    = (row.registration_data as Record<string, string>) ?? {};
    const email  = (reg.email  ?? "").toLowerCase().trim();
    const mobile = (reg.mobile ?? "").trim();

    const flags: string[] = [];
    if (email  && (emailMap.get(email)   ?? 0) > 1) flags.push("Duplicate email");
    if (mobile && (mobileMap.get(mobile) ?? 0) > 1) flags.push("Duplicate mobile");
    if (email  && (payoutMap.get(email)  ?? 0) > 1) flags.push("Duplicate payout");

    return flags.length ? { ...r, flags } : r;
  });
}
