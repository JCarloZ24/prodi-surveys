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
                Enter this code to continue for <strong style="color:#18181B">${safeEmail}</strong>.
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

export type SendOtpResult = { ok: true; reused?: boolean };

// Generate (or reuse a recent) OTP for an email and send it. When `resend` is
// false and an unused, unexpired code was issued in the last 2 minutes, the
// existing code is kept to avoid spamming.
export async function sendOtp(
  email: string,
  resend = false,
): Promise<SendOtpResult> {
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
      throw new Error(`OTP recent lookup failed: ${recentError.message}`);
    }
    if (recentCode) return { ok: true, reused: true };
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error: dbError } = await db
    .from("otp_codes")
    .insert({ email, code, expires_at: expiresAt });
  if (dbError) {
    throw new Error(`OTP insert failed: ${dbError.message}`);
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

  return { ok: true };
}

// Verify a submitted code. Returns true and marks the code used when valid.
export async function verifyOtp(email: string, code: string): Promise<boolean> {
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

  if (error) throw new Error(`OTP lookup failed: ${error.message}`);
  if (!data) return false;

  const { error: updateError } = await db
    .from("otp_codes")
    .update({ used: true })
    .eq("id", data.id);
  if (updateError) throw new Error(`OTP update failed: ${updateError.message}`);

  return true;
}
