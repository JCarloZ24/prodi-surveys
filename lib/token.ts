// Canonical respondent-token labels + serializers for the generic token_data column.
// token_data holds one of two shapes, by survey path:
//   • SME / Agri-Tech → a cash payout  (method, account name/number, bank)
//   • TSI             → a tumbler shipment (colour, recipient, address)
//
// build*Data turn the in-memory state into the human-readable shape persisted to
// token_data; read* normalize a stored row (labeled OR pre-relabel camelCase) back
// into the canonical object the mapper and payout emails consume.

import type { PayoutDetails, ShippingDetails } from "./types";

export const PAYOUT_Q = {
  method: "Payout method",
  bank: "Bank name",
  acctName: "Account name",
} as const;

export const SHIPPING_Q = {
  color: "Tumbler color",
  recipientName: "Recipient name",
  recipientPhone: "Recipient phone",
  address: "Shipping address",
} as const;

// Human label for each tumbler colour code (matches the Shipping step's swatches).
const TUMBLER_COLOR_LABELS: Record<string, string> = {
  grey: "Light Grey",
  blue: "Navy Blue",
  black: "Matte Black",
};

// The account-number question label depends on the payout method, mirroring the
// Payout step (e-wallets ask for a mobile number, banks an account number).
export function payoutNumberLabel(method: string): string {
  if (method === "GCash" || method === "Maya") return "Mobile number";
  if (method === "Bank transfer") return "Account number";
  return "Account / reference number";
}

export function buildPayoutData(p: PayoutDetails): Record<string, string> {
  const out: Record<string, string> = { [PAYOUT_Q.method]: p.method || "" };
  // Bank name is only relevant (and asked) for a bank transfer.
  if (p.method === "Bank transfer") out[PAYOUT_Q.bank] = p.bank || "";
  out[PAYOUT_Q.acctName] = p.acctName || "";
  out[payoutNumberLabel(p.method)] = p.acctNum || "";
  return out;
}

export function buildShippingData(s: ShippingDetails): Record<string, string> {
  return {
    [SHIPPING_Q.color]: TUMBLER_COLOR_LABELS[s.color] ?? s.color ?? "",
    [SHIPPING_Q.recipientName]: s.recipientName || "",
    [SHIPPING_Q.recipientPhone]: s.recipientPhone || "",
    [SHIPPING_Q.address]: s.address || "",
  };
}

// Canonical payout shape recovered from token_data (labeled keys first, then the
// pre-relabel camelCase keys). acctNum lives under a method-specific label, so the
// method is resolved first and used to find it.
export function readPayout(token: Record<string, unknown>): {
  method: string;
  acctName: string;
  acctNum: string;
  bank: string;
} {
  const method = String(token[PAYOUT_Q.method] ?? token.method ?? "");
  return {
    method,
    acctName: String(token[PAYOUT_Q.acctName] ?? token.acctName ?? ""),
    acctNum: String(token[payoutNumberLabel(method)] ?? token.acctNum ?? ""),
    bank: String(token[PAYOUT_Q.bank] ?? token.bank ?? ""),
  };
}

// Canonical shipping shape recovered from token_data (labeled keys first, then the
// pre-relabel camelCase keys).
export function readShipping(token: Record<string, unknown>): {
  color: string;
  recipientName: string;
  recipientPhone: string;
  address: string;
} {
  return {
    color: String(token[SHIPPING_Q.color] ?? token.color ?? ""),
    recipientName: String(token[SHIPPING_Q.recipientName] ?? token.recipientName ?? ""),
    recipientPhone: String(token[SHIPPING_Q.recipientPhone] ?? token.recipientPhone ?? ""),
    address: String(token[SHIPPING_Q.address] ?? token.address ?? ""),
  };
}
