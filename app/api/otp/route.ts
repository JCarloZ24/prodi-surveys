import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase-server";

// OTP codes are written/verified server-side with the service-role client so the
// anon role needs no access to the otp_codes table (no anon RLS policies).
const db = createAdminClient();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/otp — generate and email a 6-digit OTP
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error: dbError } = await db.from("otp_codes").insert({ email, code, expires_at: expiresAt });
  if (dbError) {
    console.error("OTP insert error:", dbError);
    return NextResponse.json({ error: "Failed to create OTP" }, { status: 500 });
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Your Prodi-Surveys verification code",
      text: `Your verification code is: ${code}\n\nThis code expires in 15 minutes. Do not share it with anyone.`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#18181B">Verify your email</h2>
          <p style="color:#52525B">Enter this code in the survey to continue:</p>
          <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#E0195F;margin:24px 0">${code}</div>
          <p style="color:#71717A;font-size:13px">This code expires in 15 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Email send error:", emailError);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// PUT /api/otp — verify the submitted code
export async function PUT(req: NextRequest) {
  const { email, code } = await req.json();
  if (!email || !code) {
    return NextResponse.json({ error: "Email and code required" }, { status: 400 });
  }

  const { data } = await db
    .from("otp_codes")
    .select()
    .eq("email", email)
    .eq("code", code)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  await db.from("otp_codes").update({ used: true }).eq("id", data.id);

  return NextResponse.json({ ok: true });
}
