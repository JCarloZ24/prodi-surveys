import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { emailDefs } from "@/lib/emails";
import { renderEmailHtml, LOGO_ATTACHMENT } from "@/lib/email-renderer";
import { createTransporter, FROM_ADDRESS, TRANSACTIONAL_HEADERS } from "@/lib/mailer";
import { getAppSettings } from "@/lib/settings";
import { REG_Q } from "@/lib/registration";
import { readPayout, readShipping } from "@/lib/token";

// Read a registration field by its labeled key, falling back to the pre-relabel
// camelCase key so older rows still resolve.
function regField(reg: Record<string, string>, label: string, legacy: string): string {
  return reg[label] || reg[legacy] || "";
}

// The "You're verified" email is a plain confirmation now — respondents are not
// paid, so it carries no token/payout details.
function buildVerifiedVars(row: Record<string, unknown>): Record<string, string> {
  const reg = (row.registration_data as Record<string, string>) ?? {};
  const firstName = (regField(reg, REG_Q.name, "name")).split(" ")[0] || "there";
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

// Vars for the respondent cash-token "paid-token" email (SME / Agri-Tech).
function buildRespondentCashPaidVars(
  row: Record<string, unknown>,
  respondentToken: number,
): Record<string, string> {
  const reg = (row.registration_data as Record<string, string>) ?? {};
  // SME/Agri-Tech: token_data holds the cash-payout shape.
  const pay = row.token_data ? readPayout(row.token_data as Record<string, unknown>) : null;
  const firstName = (regField(reg, REG_Q.name, "name")).split(" ")[0] || "there";
  const methodName = pay?.method ? String(pay.method) : "";
  const acctNum = pay?.acctNum ? String(pay.acctNum) : "";
  const method = acctNum ? `${methodName} •••• ${acctNum.slice(-3)}`.trim() : (methodName || "—");
  const dateSent = new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  return { firstName, amount: `₱${respondentToken.toLocaleString()}`, method, dateSent };
}

// Vars for the respondent tumbler "paid-tumbler" email (TSI).
function buildRespondentTumblerVars(row: Record<string, unknown>): Record<string, string> {
  const reg = (row.registration_data as Record<string, string>) ?? {};
  // TSI: token_data holds the tumbler-shipping shape.
  const ship = row.token_data ? readShipping(row.token_data as Record<string, unknown>) : null;
  const color = ship?.color ? ` · ${ship.color}` : "";
  const shippedTo = ship?.recipientName || regField(reg, REG_Q.name, "name") || "—";
  return { item: `Tumbler${color}`, shippedTo, estDelivery: "7–14 business days" };
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
    respondent_pay_status?: string;
  };
  const updates: Record<string, string | null> = {};

  const validStatuses = ["submitted", "verified", "rejected", "follow_up"];
  if (body.status && validStatuses.includes(body.status)) {
    updates.status = body.status;
    if (body.status === "verified") {
      updates.enumerator_payout_status = "pending";
    }
  }

  const db = createAdminClient();

  const validPayStatuses = ["pending", "approved", "paid", "on_hold"];
  if (body.pay_status && validPayStatuses.includes(body.pay_status)) {
    updates.enumerator_payout_status = body.pay_status;
    if (body.pay_status === "paid") {
      // Enforce the chain: the enumerator can only be paid after the respondent
      // token for this submission has been paid.
      const { data: cur } = await db
        .from("submissions")
        .select("respondent_payout_status")
        .eq("id", id)
        .single();
      if ((cur?.respondent_payout_status ?? null) !== "paid") {
        return NextResponse.json({ error: "Pay the respondent token first." }, { status: 400 });
      }
      updates.enumerator_paid_at = new Date().toISOString();
    }
  }

  // Respondent token payout lifecycle (cash for SME/Agri-Tech, tumbler for TSI).
  if (body.respondent_pay_status && validPayStatuses.includes(body.respondent_pay_status)) {
    updates.respondent_payout_status = body.respondent_pay_status;
    if (body.respondent_pay_status === "paid") {
      updates.respondent_paid_at = new Date().toISOString();
      // Paying the respondent token auto-approves the enumerator's payout.
      updates.enumerator_payout_status = "approved";
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }
  updates.updated_at = new Date().toISOString();

  const { error } = await db
    .from("submissions")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch row once for any email-triggering status change. Note the enumerator
  // `paid` email keys off body.pay_status (not updates.enumerator_payout_status,
  // which is also set to "approved" when the respondent token is paid).
  const enumeratorPaid = body.pay_status === "paid";
  const respondentPaid = updates.respondent_payout_status === "paid";
  const needsEmail =
    updates.status === "verified" ||
    updates.status === "rejected" ||
    enumeratorPaid ||
    respondentPaid;

  if (needsEmail) {
    const { data: row } = await db
      .from("submissions")
      .select("registration_data, survey_type, enumerator_slug, token_data")
      .eq("id", id)
      .single();

    if (row) {
      const r = row as Record<string, unknown>;
      const reg = (r.registration_data as Record<string, string>) ?? {};
      const email = regField(reg, REG_Q.email, "email");

      // Respondent confirmation emails (no money): verified / rejected.
      if (email && (updates.status === "verified" || updates.status === "rejected")) {
        const defId = updates.status === "verified" ? "verified" : "rejected";
        const vars = defId === "verified" ? buildVerifiedVars(r) : {};
        sendEmail(email, defId, vars).catch((e) =>
          console.error(`QA ${defId} email error:`, e),
        );
      }

      // Respondent token paid → notify the respondent. TSI gets a tumbler email,
      // SME/Agri-Tech a cash-token email.
      if (email && respondentPaid) {
        const isTSI = (r.survey_type as string) === "TSI";
        if (isTSI) {
          sendEmail(email, "paid-tumbler", buildRespondentTumblerVars(r)).catch((e) =>
            console.error("Respondent tumbler email error:", e),
          );
        } else {
          const { respondentToken } = await getAppSettings();
          sendEmail(email, "paid-token", buildRespondentCashPaidVars(r, respondentToken)).catch((e) =>
            console.error("Respondent token email error:", e),
          );
        }
      }

      // Payout marked paid → notify the ENUMERATOR who earned the flat ₱400 for
      // this verified survey. Respondents/referrers are not paid.
      if (updates.enumerator_payout_status === "paid") {
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
