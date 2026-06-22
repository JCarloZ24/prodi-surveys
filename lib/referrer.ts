import { createAdminClient } from "@/lib/supabase-server";
import { code as codeOf, hash } from "@/lib/format";
import { payoutError } from "@/lib/payout";
import type { PayoutDetails } from "@/lib/types";

export const REFERRER_TYPES = ["enumerator", "respondent", "others"] as const;
export type ReferrerType = (typeof REFERRER_TYPES)[number];

export type ReferrerInput = {
  full_name?: string;
  email?: string;
  phone?: string;
  type?: string;
  payout_details?: Partial<PayoutDetails>;
};

export type ValidatedReferrer = {
  full_name: string;
  email: string | null;
  phone: string | null;
  type: ReferrerType;
  payout_details: PayoutDetails;
};

// Validate the create/edit payload. Returns either an error message or the
// normalized values to persist. Mirrors the signup field rules.
export function validateReferrer(body: ReferrerInput): { error: string } | { value: ValidatedReferrer } {
  const full_name = (body.full_name ?? "").trim();
  const email = (body.email ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const type = (body.type ?? "") as ReferrerType;

  if (!full_name) return { error: "Full name is required" };
  if (!REFERRER_TYPES.includes(type)) return { error: "Choose a referrer type" };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "A valid email is required" };
  if (!phone) return { error: "Phone number is required" };

  const payout: PayoutDetails = {
    method: (body.payout_details?.method ?? "").trim(),
    acctName: (body.payout_details?.acctName ?? "").trim(),
    acctNum: (body.payout_details?.acctNum ?? "").trim(),
    bank: (body.payout_details?.bank ?? "").trim(),
  };
  const pErr = payoutError(payout);
  if (pErr) return { error: pErr };

  return { value: { full_name, email, phone, type, payout_details: payout } };
}

// Generate a unique PS-XXXX referral code not already used by a referrer. The
// unique constraint on referrer.referral_code is the final backstop.
export async function generateReferrerCode(seed: string): Promise<string> {
  const db = createAdminClient();
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = "PS-" + codeOf(hash(seed + ":" + attempt + ":" + Date.now()));
    const { data } = await db
      .from("referrer")
      .select("id")
      .eq("referral_code", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  // Extremely unlikely fallback.
  return "PS-" + codeOf(hash(seed + ":" + Math.random()));
}
