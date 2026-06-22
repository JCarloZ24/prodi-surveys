import type { PayoutDetails } from "@/lib/types";

// Payout methods + validation shared by the respondent/enumerator signup payout
// step and the admin referrer form. Mirrors the survey flow (RespondentFlow):
// every method needs an account name + number; Bank transfer also needs the bank.
export const PAYOUT_METHODS = ["GCash", "Maya", "Bank transfer", "Other"];

export function payoutError(p: PayoutDetails): string | null {
  if (!PAYOUT_METHODS.includes(p.method)) return "Choose a payout method";
  if (!p.acctName.trim()) return "Account name is required";
  if (!p.acctNum.trim()) return "Account / mobile number is required";
  if (p.method === "Bank transfer" && !p.bank.trim()) return "Bank name is required";
  return null;
}

// Label for the number field, given the chosen method.
export function payoutNumberLabel(method: string): string {
  if (method === "GCash" || method === "Maya") return "Mobile number";
  if (method === "Bank transfer") return "Account number";
  return "Account / reference number";
}
