import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

// POST /api/referral/promote — record a respondent as a referrer (type=respondent)
// when they opt in to refer someone on the success screen. The respondent's
// generated code becomes the referrer's PS-XXXX code. Idempotent: re-clicks or a
// pre-existing referrer with the same code are no-ops (unique referral_code).
// Service-role: the referrer table has RLS on with no anon policy.
const CODE_RE = /^PS-[A-Z0-9]{4,}$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const referral_code = String(body.referral_code ?? "").trim().toUpperCase();
  if (!CODE_RE.test(referral_code)) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
  }

  const full_name = String(body.full_name ?? "").trim() || "Respondent";
  const email = String(body.email ?? "").trim() || null;
  const phone = String(body.phone ?? "").trim() || null;

  // Carry over the payout details the respondent entered on the survey's payout
  // step so the referrer row is prefilled. Normalize to the PayoutDetails shape;
  // only persist when a method was actually chosen (TSI/tumbler respondents send
  // null), otherwise store null.
  const pd = body.payout_details;
  const payout_details =
    pd && typeof pd === "object" && String(pd.method ?? "").trim()
      ? {
          method: String(pd.method ?? "").trim(),
          acctName: String(pd.acctName ?? "").trim(),
          acctNum: String(pd.acctNum ?? "").trim(),
          bank: String(pd.bank ?? "").trim(),
        }
      : null;

  const db = createAdminClient();
  const { error } = await db
    .from("referrer")
    .upsert(
      {
        full_name,
        email,
        phone,
        type: "respondent",
        payout_details,
        referral_code,
        created_by: null,
      },
      { onConflict: "referral_code", ignoreDuplicates: true },
    );

  if (error) {
    console.error("Referrer promote error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
