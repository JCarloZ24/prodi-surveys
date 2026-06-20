import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase-server";
import { requireAnyEnv } from "@/lib/env";

// OTP codes are written/verified server-side with the service-role client so the
// anon role needs no access to the otp_codes table (no anon RLS policies).
function createTransporter() {
  return nodemailer.createTransport({
    host: requireAnyEnv(["SMTP_HOST"]),
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: requireAnyEnv(["SMTP_USER"]),
      pass: requireAnyEnv(["SMTP_PASS"]),
    },
  });
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function recentAutoSendCutoff() {
  return new Date(Date.now() - 2 * 60 * 1000).toISOString();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderOtpEmail(code: string, email: string) {
  const safeCode = escapeHtml(code);
  const safeEmail = escapeHtml(email);

  return `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>Verify your email</title>
      </head>
      <body style="margin:0;background:#F6F6F7;padding:0;font-family:Inter,Arial,sans-serif;color:#18181B">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">
          Use this 6-digit code to continue your Prodi-Surveys response.
        </div>
        <div style="padding:32px 16px">
          <div style="margin:0 auto;max-width:520px;overflow:hidden;border:1px solid #E4E4E7;border-radius:18px;background:#FFFFFF">
            <div style="padding:28px 28px 18px;text-align:center">
              <div style="margin:0 auto 18px;width:48px;height:48px;border-radius:14px;background:#FCE7F0;color:#E0195F;font-size:22px;font-weight:900;line-height:48px;text-align:center">
                P
              </div>
              <div style="margin-bottom:8px;color:#71717A;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase">
                Prodi-Surveys
              </div>
              <h1 style="margin:0;color:#18181B;font-size:24px;line-height:1.25;font-weight:900">
                Verify your email
              </h1>
              <p style="margin:12px auto 0;max-width:390px;color:#52525B;font-size:14px;line-height:1.6">
                Enter this code to continue the survey for <strong style="color:#18181B">${safeEmail}</strong>.
              </p>
            </div>

            <div style="padding:0 28px 26px">
              <div style="border-radius:16px;background:#18181B;padding:22px;text-align:center">
                <div style="margin-bottom:8px;color:#A1A1AA;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">
                  Verification code
                </div>
                <div style="color:#FFFFFF;font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;font-size:38px;line-height:1;font-weight:900;letter-spacing:10px">
                  ${safeCode}
                </div>
              </div>

              <p style="margin:18px 0 0;color:#52525B;font-size:13px;line-height:1.6;text-align:center">
                This code expires in <strong style="color:#18181B">15 minutes</strong>. For your security, do not share it with anyone.
              </p>
            </div>

            <div style="border-top:1px solid #F0F0F2;background:#FAFAFA;padding:18px 28px;text-align:center">
              <p style="margin:0;color:#71717A;font-size:12px;line-height:1.6">
                If you did not request this code, you can safely ignore this email.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

// POST /api/otp — generate and email a 6-digit OTP
export async function POST(req: NextRequest) {
  try {
    const { email, resend } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const db = createAdminClient();

    if (!resend) {
      const { data: recentCode, error: recentError } = await db
        .from("otp_codes")
        .select("id")
        .eq("email", email)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .gt("created_at", recentAutoSendCutoff())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentError) {
        console.error("OTP recent lookup error:", recentError);
        return NextResponse.json({ error: "Verification email could not be sent" }, { status: 500 });
      }
      if (recentCode) return NextResponse.json({ ok: true, reused: true });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: dbError } = await db.from("otp_codes").insert({ email, code, expires_at: expiresAt });
    if (dbError) {
      console.error("OTP insert error:", dbError);
      return NextResponse.json({ error: "Failed to create OTP" }, { status: 500 });
    }

    await createTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Your Prodi-Surveys verification code",
      text: [
        "Verify your email for Prodi-Surveys",
        "",
        `Your verification code is: ${code}`,
        "",
        "This code expires in 15 minutes. Do not share it with anyone.",
        "",
        "If you did not request this code, you can safely ignore this email.",
      ].join("\n"),
      html: renderOtpEmail(code, email),
    });

    return NextResponse.json({ ok: true });
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

    const db = createAdminClient();
    const { data, error } = await db
      .from("otp_codes")
      .select()
      .eq("email", email)
      .eq("code", code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("OTP lookup error:", error);
      return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    const { error: updateError } = await db.from("otp_codes").update({ used: true }).eq("id", data.id);
    if (updateError) {
      console.error("OTP update error:", updateError);
      return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
