// Single source of truth for mapping a raw Supabase submissions row → Respondent.
// Imported by both the portal server component and the portal API route.

import { avatarColor } from "./format";
import type { CollectionMode, Respondent } from "./types";

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

  // Payout method label
  let method = "—";
  let acct = "—";
  if (pay) {
    method = pay.method ?? "—";
    acct = pay.acctNum ? `${pay.method ?? ""} •••• ${String(pay.acctNum).slice(-3)}` : "—";
  } else if (ship) {
    const colorLabels: Record<string, string> = { grey: "Charcoal grey", blue: "Sky blue", black: "Black" };
    method = "Tumbler · " + (colorLabels[ship.color] ?? ship.color ?? "Grey");
    acct = "Shipping";
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
    position: reg.position ?? "—",
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
    mode,
    enumerator,
    payStatus,
    method,
    acct,
    compMin: 0,
    flags: [],
    code: reg.generated_referral_code ?? "",
    createdDays,
    color: avatarColor(name),
    payoutOn: Boolean(pay),
    // Pass paidDate through as a custom field so the Payouts view can display it.
    ...(paidDate ? { _paidDate: paidDate } : {}),
  } as Respondent;
}
