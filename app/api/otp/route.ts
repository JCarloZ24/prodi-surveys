import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { createTransporter, FROM_ADDRESS, LOGO_ATTACHMENT, TRANSACTIONAL_HEADERS } from "@/lib/mailer";

// OTP codes are written/verified server-side with the service-role client so the
// anon role needs no access to the otp_codes table (no anon RLS policies).

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
  const accent = "#E0195F";

  const logoImg = `<img src="cid:logomark" width="28" height="28" alt="P" style="display:inline-block;vertical-align:middle;border:0"/>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta http-equiv="Content-Type" content="text/html;charset=UTF-8"/>
  <title>Your Prodi-Surveys verification code</title>
</head>
<body style="margin:0;padding:0;background:#F0F0F3;font-family:Inter,-apple-system,BlinkMacSystemFont,Arial,sans-serif;color:#18181B">
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0">Enter this code to verify your email and continue.</div>

  <div style="padding:32px 16px">
    <div style="margin:0 auto;max-width:540px;overflow:hidden;border-radius:18px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.08)">

      <div style="height:5px;background:${accent}"></div>

      <div style="padding:24px 32px 0">
        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
          <tr>
            <td style="vertical-align:middle;padding-right:10px">${logoImg}</td>
            <td style="vertical-align:middle;font-size:14px;font-weight:800;letter-spacing:-.3px;color:#18181B;font-family:Inter,-apple-system,BlinkMacSystemFont,Arial,sans-serif">Prodi-Surveys</td>
          </tr>
        </table>
      </div>

      <div style="padding:20px 32px 8px">
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:900;line-height:1.3;color:#18181B">
          Verify your email address
        </h1>
        <p style="margin:0 0 20px;font-size:13.5px;line-height:1.7;color:${accent}">
          Thanks for registering for the Prodigitality baseline survey. Enter the code below to verify your email and continue to your survey.
        </p>

        <div style="border-radius:12px;background:#F5F5F7;padding:22px;text-align:center">
          <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;font-size:34px;font-weight:900;letter-spacing:10px;color:#18181B">
            ${safeCode}
          </div>
        </div>

        <p style="margin:16px 0 0;font-size:12px;line-height:1.65;color:#9CA3AF">
          This code expires in 15 minutes. If you didn&rsquo;t request it, you can safely ignore this email.
        </p>
      </div>

      <div style="margin-top:16px;border-top:1px solid #F2F2F4;padding:20px 32px">
        <p style="margin:0;font-size:11px;line-height:1.7;color:#9CA3AF">
          <span style="color:#6B7280">Prodigitality</span> &middot; <a href="https://prodigitalitydata.live" style="color:${accent};text-decoration:none">prodigitalitydata.live</a>
        </p>
        <p style="margin:0;font-size:11px;line-height:1.7;color:#9CA3AF">
          You received this email because you registered for or were added to the <a href="https://prodigitalitydata.live" style="color:${accent};text-decoration:none">Prodigitality</a> baseline survey.
        </p>
      </div>
    </div>

    <p style="margin:12px 0 0;text-align:center;font-size:11px;color:#ADADB8">
      Enter this code to verify your email and continue.
    </p>
  </div>
</body>
</html>`;
  void safeEmail;
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
      from: FROM_ADDRESS,
      to: email,
      subject: "Your Prodi-Surveys verification code",
      headers: TRANSACTIONAL_HEADERS,
      text: [
        "Prodi-Surveys — Verify your email address",
        "",
        "Thanks for registering for the Prodigitality baseline survey.",
        "Enter the code below to verify your email and continue to your survey.",
        "",
        `Your verification code: ${code}`,
        "",
        "This code expires in 15 minutes. For your security, do not share it with anyone.",
        "",
        "Prodigitality · prodigitalitydata.live",
      ].join("\n"),
      html: renderOtpEmail(code, email),
      attachments: [LOGO_ATTACHMENT],
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
