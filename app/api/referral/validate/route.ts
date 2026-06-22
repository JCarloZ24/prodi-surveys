import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

function normalizeReferralCode(value: unknown) {
  return String(value || "").trim().toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    const normalized = normalizeReferralCode(code);

    if (!normalized) {
      return NextResponse.json({ valid: false, error: "Referral code required" }, { status: 400 });
    }

    if (!/^PS-[A-Z0-9]{4,}$/.test(normalized)) {
      return NextResponse.json({ valid: false });
    }

    const db = createAdminClient();

    // A code is valid if it matches a respondent's generated code OR an
    // admin-managed referrer's code.
    const { data, error } = await db
      .from("submissions")
      .select("id")
      .eq("registration->>generated_referral_code", normalized)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Referral validation error:", error);
      return NextResponse.json({ error: "Referral validation failed" }, { status: 500 });
    }
    if (data) return NextResponse.json({ valid: true });

    const { data: ref, error: refError } = await db
      .from("referrer")
      .select("id")
      .eq("referral_code", normalized)
      .limit(1)
      .maybeSingle();

    if (refError) {
      console.error("Referral validation error:", refError);
      return NextResponse.json({ error: "Referral validation failed" }, { status: 500 });
    }

    return NextResponse.json({ valid: !!ref });
  } catch (error) {
    console.error("Referral validation error:", error);
    return NextResponse.json({ error: "Referral validation failed" }, { status: 500 });
  }
}
