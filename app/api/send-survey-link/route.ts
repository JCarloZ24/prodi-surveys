import { NextRequest, NextResponse } from "next/server";
import { createTransporter, FROM_ADDRESS, LOGO_ATTACHMENT, TRANSACTIONAL_HEADERS } from "@/lib/mailer";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderSurveyLinkEmail(name: string, surveyLink: string) {
  const safeName = escapeHtml(name);
  const safeLink = escapeHtml(surveyLink);
  const accent = "#E0195F";

  const logoImg = `<img src="cid:logomark" width="28" height="28" alt="P" style="display:inline-block;vertical-align:middle;border:0"/>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta http-equiv="Content-Type" content="text/html;charset=UTF-8"/>
  <title>Your Prodigitality Survey Link</title>
</head>
<body style="margin:0;padding:0;background:#F0F0F3;font-family:Inter,-apple-system,BlinkMacSystemFont,Arial,sans-serif;color:#18181B">
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0">Your personalized survey link is ready — it takes about 5–10 minutes.</div>
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
          Your survey is ready, ${safeName}!
        </h1>
        <p style="margin:0 0 20px;font-size:13.5px;line-height:1.7;color:${accent}">
          You&rsquo;ve been registered for the Prodigitality baseline survey. Tap the button below to complete your survey at your convenience &mdash; it only takes about 5&ndash;10 minutes.
        </p>
        <div style="margin:24px 0">
          <a href="${safeLink}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;font-size:13.5px;font-weight:700;padding:12px 24px;border-radius:10px">
            Start my survey &rarr;
          </a>
        </div>
        <p style="margin:0;font-size:12px;line-height:1.65;color:#9CA3AF">
          Or copy this link into your browser:<br/>
          <a href="${safeLink}" style="color:${accent};word-break:break-all">${safeLink}</a>
        </p>
        <p style="margin:12px 0 0;font-size:12px;line-height:1.65;color:#9CA3AF">
          This link is personalized for you. Please do not forward it to others.
        </p>
      </div>
      <div style="margin-top:16px;border-top:1px solid #F2F2F4;padding:20px 32px">
        <p style="margin:0;font-size:11px;line-height:1.7;color:#9CA3AF">
          <span style="color:#6B7280">Prodigitality</span> &middot; <a href="https://prodigitalitydata.live" style="color:${accent};text-decoration:none">prodigitalitydata.live</a>
        </p>
        <p style="margin:4px 0 0;font-size:11px;line-height:1.7;color:#9CA3AF">
          You received this email because you were registered for the Prodigitality baseline survey by an enumerator.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// POST /api/send-survey-link — email the respondent their self-service survey link
export async function POST(req: NextRequest) {
  try {
    const { email, name, surveyLink } = await req.json();
    if (!email || !surveyLink) {
      return NextResponse.json({ error: "email and surveyLink are required" }, { status: 400 });
    }

    const safeName = (name || "there").trim();

    await createTransporter().sendMail({
      from: FROM_ADDRESS,
      to: email,
      subject: "Your Prodigitality survey link",
      headers: TRANSACTIONAL_HEADERS,
      text: [
        "Prodi-Surveys — Your survey is ready",
        "",
        `Hi ${safeName},`,
        "",
        "You've been registered for the Prodigitality baseline survey.",
        "Use the link below to complete your survey at your convenience (about 5–10 minutes).",
        "",
        `Survey link: ${surveyLink}`,
        "",
        "This link is personalized for you — please do not forward it.",
        "",
        "Prodigitality · prodigitalitydata.live",
      ].join("\n"),
      html: renderSurveyLinkEmail(safeName, surveyLink),
      attachments: [LOGO_ATTACHMENT],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Survey link email error:", error);
    return NextResponse.json({ error: "Email could not be sent" }, { status: 500 });
  }
}
