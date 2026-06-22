import { NextRequest, NextResponse } from "next/server";
import { sendOtp, verifyOtp } from "@/lib/otp";

// POST /api/otp — generate and email a 6-digit OTP
export async function POST(req: NextRequest) {
  try {
    const { email, resend } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const result = await sendOtp(email, Boolean(resend));
    return NextResponse.json(result);
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Verification email could not be sent" }, { status: 500 });
  }
}

// PUT /api/otp — verify the submitted code
export async function PUT(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: "Email and code required" }, { status: 400 });
    }

    const ok = await verifyOtp(email, code);
    if (!ok) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
