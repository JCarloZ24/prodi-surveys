import type { PayoutDetails } from "@/lib/types";

// Payout methods + validation shared by the respondent/enumerator signup payout
// step and the admin referrer form. Mirrors the survey flow (RespondentFlow):
// every method needs an account name + number; Bank transfer also needs the bank.
export const PAYOUT_METHODS = ["GCash", "Maya", "Bank transfer", "Other"];

export function payoutError(p: PayoutDetails): string | null {
  if (!PAYOUT_METHODS.includes(p.method)) return "Choose a payout method";
  if (!p.acctName.trim()) return "Account name is required";
  if (!p.acctNum.trim()) return "Account / mobile number is required";
  if (p.method === "GCash" || p.method === "Maya") {
    const digits = p.acctNum.replace(/\D/g, "");
    if (digits.length !== 11 || !digits.startsWith("09"))
      return "Enter a valid 11-digit mobile number starting with 09";
  }
  if (p.method === "Bank transfer" && !p.bank.trim()) return "Bank name is required";
  return null;
}

// Label for the number field, given the chosen method.
export function payoutNumberLabel(method: string): string {
  if (method === "GCash" || method === "Maya") return "Mobile number";
  if (method === "Bank transfer") return "Account number";
  return "Account / reference number";
}

// Canonical labels for the cash-payout fields persisted to submissions.token_data,
// mirroring buildRegistrationData/buildProfileData so a stored row reads as the
// payout form. The number field is keyed by its method-specific label.
export const PAYOUT_Q = {
  method: "Payout method",
  acctName: "Account name",
  bank: "Bank name",
} as const;

// Serialize the in-memory camelCase PayoutDetails into the labeled shape stored in
// token_data (SME / Agri-Tech cash payouts).
export function buildPayoutData(p: PayoutDetails): Record<string, string> {
  const out: Record<string, string> = {
    [PAYOUT_Q.method]: p.method || "",
    [PAYOUT_Q.acctName]: p.acctName || "",
    [payoutNumberLabel(p.method)]: p.acctNum || "",
  };
  if (p.method === "Bank transfer") out[PAYOUT_Q.bank] = p.bank || "";
  return out;
}

// Readers that pull a payout field from a stored token_data record, accepting both
// the labeled shape (new rows) and the legacy camelCase shape (pre-relabel rows).
export function readPayoutMethod(rec: Record<string, string>): string {
  return rec[PAYOUT_Q.method] || rec.method || "";
}
export function readPayoutAcctName(rec: Record<string, string>): string {
  return rec[PAYOUT_Q.acctName] || rec.acctName || "";
}
export function readPayoutAcctNum(rec: Record<string, string>): string {
  return (
    rec["Mobile number"] ||
    rec["Account number"] ||
    rec["Account / reference number"] ||
    rec.acctNum ||
    ""
  );
}
