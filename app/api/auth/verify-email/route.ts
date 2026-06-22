import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyOtp } from "@/lib/otp";

// POST /api/auth/verify-email — verify the OTP for a signup email and flip the
// profile's is_email_verified flag. The account still needs admin approval.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    code?: string;
  };
  const email = body.email?.toLowerCase().trim();
  const code = body.code?.trim();

  if (!email || !code) {
    return NextResponse.json({ error: "Email and code required" }, { status: 400 });
  }

  let ok: boolean;
  try {
    ok = await verifyOtp(email, code);
  } catch (e) {
    console.error("verify-email OTP error:", e);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
  if (!ok) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  const db = createAdminClient();
  const { error } = await db
    .from("profiles")
    .update({ is_email_verified: true, updated_at: new Date().toISOString() })
    .eq("email", email);

  if (error) {
    console.error("verify-email profile update error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
