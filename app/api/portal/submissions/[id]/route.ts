import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { emailDefs } from "@/lib/emails";
import { renderEmailHtml, LOGO_ATTACHMENT } from "@/lib/email-renderer";
import { createTransporter, FROM_ADDRESS, TRANSACTIONAL_HEADERS } from "@/lib/mailer";
import { getAppSettings } from "@/lib/settings";

// The "You're verified" email is a plain confirmation now — respondents are not
// paid, so it carries no token/payout details.
function buildVerifiedVars(row: Record<string, unknown>): Record<string, string> {
  const reg = (row.registration as Record<string, string>) ?? {};
  const firstName = (reg.name ?? "").split(" ")[0] || "there";
  return { firstName };
}

async function sendEmail(
  toEmail: string,
  defId: string,
  vars: Record<string, string>,
): Promise<void> {
  const def = emailDefs().find((d) => d.id === defId);
  if (!def) return;

  const html = renderEmailHtml(def, vars);
  const text = def.blocks
    .filter((b) => b.type === "h" || b.type === "p" || b.type === "note")
    .map((b) => b.text ?? "")
    .join("\n\n");

  await createTransporter().sendMail({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: def.subject,
    headers: TRANSACTIONAL_HEADERS,
    text,
    html,
    attachments: [LOGO_ATTACHMENT],
  });
}

// Vars for the enumerator "Your survey payout has been sent" (`paid`) email.
function buildEnumeratorPaidVars(
  enumProfile: { full_name: string | null; payout_details: Record<string, unknown> | null },
  surveyPayout: number,
): Record<string, string> {
  const firstName = (enumProfile.full_name ?? "").split(" ")[0] || "there";
  const pay = enumProfile.payout_details ?? null;
  let payoutMethod = "—";
  const method = pay?.method ? String(pay.method) : "";
  const acctNum = pay?.acctNum ? String(pay.acctNum) : "";
  if (acctNum) payoutMethod = `${method} •••• ${acctNum.slice(-3)}`.trim();
  else if (method) payoutMethod = method;

  const dateSent = new Date().toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
  });

  return {
    firstName,
    amount: `₱${surveyPayout.toLocaleString()}`,
    surveys: "1",
    payoutMethod,
    dateSent,
  };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getProfile();
  if (!me || me.status !== "approved") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (me.role === "stakeholder") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as {
    status?: string;
    pay_status?: string;
  };
  const updates: Record<string, string | null> = {};

  const validStatuses = ["submitted", "verified", "rejected", "follow_up"];
  if (body.status && validStatuses.includes(body.status)) {
    updates.status = body.status;
    if (body.status === "verified") {
      updates.payout_status = "pending";
    }
  }

  const validPayStatuses = ["pending", "approved", "paid", "on_hold"];
  if (body.pay_status && validPayStatuses.includes(body.pay_status)) {
    updates.payout_status = body.pay_status;
    if (body.pay_status === "paid") {
      updates.paid_at = new Date().toISOString();
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const db = createAdminClient();
  const { error } = await db
    .from("submissions")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch row once for any email-triggering status change.
  const needsEmail =
    updates.status === "verified" ||
    updates.status === "rejected" ||
    updates.payout_status === "paid";

  if (needsEmail) {
    const { data: row } = await db
      .from("submissions")
      .select("registration, survey_type, enumerator_slug")
      .eq("id", id)
      .single();

    if (row) {
      const r = row as Record<string, unknown>;
      const reg = (r.registration as Record<string, string>) ?? {};
      const email = reg.email;

      // Respondent confirmation emails (no money): verified / rejected.
      if (email && (updates.status === "verified" || updates.status === "rejected")) {
        const defId = updates.status === "verified" ? "verified" : "rejected";
        const vars = defId === "verified" ? buildVerifiedVars(r) : {};
        sendEmail(email, defId, vars).catch((e) =>
          console.error(`QA ${defId} email error:`, e),
        );
      }

      // Payout marked paid → notify the ENUMERATOR who earned the flat ₱400 for
      // this verified survey. Respondents/referrers are not paid.
      if (updates.payout_status === "paid") {
        const slug = (r.enumerator_slug as string | null) ?? "";
        if (!slug) {
          console.warn(`Paid email skipped: submission ${id} has no enumerator_slug`);
        } else {
          const { data: enumProfile } = await db
            .from("profiles")
            .select("email, full_name, payout_details")
            .eq("slug", slug)
            .maybeSingle();
          if (enumProfile?.email) {
            const { surveyPayout } = await getAppSettings();
            const vars = buildEnumeratorPaidVars(
              {
                full_name: enumProfile.full_name,
                payout_details: (enumProfile.payout_details as Record<string, unknown> | null) ?? null,
              },
              surveyPayout,
            );
            sendEmail(enumProfile.email, "paid", vars).catch((e) =>
              console.error("Enumerator paid email error:", e),
            );
          } else {
            console.warn(`Paid email skipped: no enumerator profile/email for slug ${slug}`);
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
