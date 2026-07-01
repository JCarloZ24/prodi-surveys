import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import {
  createTransporter,
  FROM_ADDRESS,
  LOGO_ATTACHMENT,
  TRANSACTIONAL_HEADERS,
} from "@/lib/mailer";
import { emailDefs } from "@/lib/emails";
import { renderEmailHtml } from "@/lib/email-renderer";
import { publicUrl } from "@/lib/public-url";
import { REG_Q } from "@/lib/registration";

// POST /api/portal/send-invite — email the self-service survey link to the respondent.
// The recipient email + name + access code are read from the submission row (service
// role), never trusted from the client. The row must already have an access_code
// (set via /api/submit/self-service).
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing submission id" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: row, error } = await db
    .from("submissions")
    .select("access_code, enumerator_slug, registration_data")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Send-invite load error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }
  if (!row.access_code) {
    return NextResponse.json({ error: "No self-service link generated yet" }, { status: 400 });
  }

  const regData = (row.registration_data ?? {}) as Record<string, string>;
  const email = (regData[REG_Q.email] || "").trim();
  const fullName = (regData[REG_Q.name] || "").trim();
  const firstName = fullName.split(/\s+/)[0] || "there";

  if (!email) {
    return NextResponse.json({ error: "No email address on file for this respondent" }, { status: 400 });
  }

  const link = publicUrl("/s/" + encodeURIComponent(row.enumerator_slug ?? "") + "/" + row.access_code);

  const def = emailDefs().find((d) => d.id === "invite");
  if (!def) {
    return NextResponse.json({ error: "Invite template missing" }, { status: 500 });
  }

  const html = renderEmailHtml(def, { firstName, surveyLink: link, href: link });

  try {
    await createTransporter().sendMail({
      from: FROM_ADDRESS,
      to: email,
      subject: def.subject,
      headers: TRANSACTIONAL_HEADERS,
      text: [
        "You've been invited to take part",
        "",
        `Hi ${firstName}, you've been invited to participate in the Prodigitality baseline survey.`,
        "The survey takes about 5–10 minutes.",
        "",
        "Start the survey:",
        link,
        "",
        "Prodigitality · prodigitalitydata.live",
      ].join("\n"),
      html,
      attachments: [LOGO_ATTACHMENT],
    });
  } catch (e) {
    console.error("Send-invite mail error:", e);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email });
}
