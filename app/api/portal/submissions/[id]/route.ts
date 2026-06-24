import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { emailDefs } from "@/lib/emails";
import { renderEmailHtml, LOGO_ATTACHMENT } from "@/lib/email-renderer";
import { createTransporter, FROM_ADDRESS, TRANSACTIONAL_HEADERS } from "@/lib/mailer";

const DEFAULT_TOKEN: Record<string, number> = { SME: 200, AgriTech: 300, TSI: 0 };

function buildVerifiedVars(row: Record<string, unknown>): Record<string, string> {
  const reg = (row.registration as Record<string, string>) ?? {};
  const pay = (row.payout_details as Record<string, string> | null) ?? null;
  const surveyType = (row.survey_type as string) ?? "SME";

  const firstName = (reg.name ?? "").split(" ")[0] || "there";

  // TSI receives a small token (not a cash payout). Blank the token/payout rows
  // (skipped by the renderer) and drop the payout wording; show a generic closing.
  if (surveyType === "TSI") {
    return {
      firstName,
      tokenAmount: "",
      payoutMethod: "",
      tokenLine: "",
      closingLine: "Our team will be in touch with the next steps.",
    };
  }

  const tokenAmt = DEFAULT_TOKEN[surveyType] ?? 0;
  const tokenAmount = tokenAmt > 0 ? `₱${tokenAmt}` : "—";
  let payoutMethod = "—";
  if (pay?.acctNum) {
    payoutMethod = `${pay.method ?? ""} •••• ${String(pay.acctNum).slice(-3)}`;
  } else if (pay?.method) {
    payoutMethod = pay.method;
  }

  return {
    firstName,
    tokenAmount,
    payoutMethod,
    tokenLine: " Your respondent token is now being processed for payout.",
    closingLine: "You'll receive another email once your token has been sent.",
  };
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

function buildPaidVars(row: Record<string, unknown>, id: string): Record<string, string> {
  const reg = (row.registration as Record<string, string>) ?? {};
  const pay = (row.payout_details as Record<string, string> | null) ?? null;
  const surveyType = (row.survey_type as string) ?? "SME";

  const tokenAmt = DEFAULT_TOKEN[surveyType] ?? 0;
  const amount = tokenAmt > 0 ? `₱${tokenAmt}` : "—";

  let payoutMethod = "—";
  if (pay?.acctNum) {
    payoutMethod = `${pay.method ?? ""} •••• ${String(pay.acctNum).slice(-3)}`;
  } else if (pay?.method) {
    payoutMethod = pay.method;
  }

  const dateSent = new Date().toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
  });

  return { amount, payoutMethod, dateSent };
}

function buildTumblerVars(row: Record<string, unknown>): Record<string, string> {
  const reg = (row.registration as Record<string, string>) ?? {};
  // TSI incentive is described generically as a "small token" — no tumbler/colour.
  return {
    shippedTo: reg.name ?? "—",
    item: "Small token",
    estDelivery: "7–14 business days",
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
    referrer_pay_status?: string;
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

  // Referral-bonus payout status (migration 013), tracked separately from the
  // respondent's own token payout.
  if (body.referrer_pay_status && validPayStatuses.includes(body.referrer_pay_status)) {
    updates.referrer_payout_status = body.referrer_pay_status;
    if (body.referrer_pay_status === "paid") {
      updates.referrer_paid_at = new Date().toISOString();
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

  const DEFAULT_BONUS: Record<string, number> = { SME: 100, AgriTech: 1000, TSI: 0 };

  // Fetch row once for any email-triggering status change.
  const needsEmail =
    updates.status === "verified" ||
    updates.status === "rejected" ||
    updates.payout_status === "paid" ||
    updates.referrer_payout_status === "approved";

  if (needsEmail) {
    const { data: row } = await db
      .from("submissions")
      .select("registration, payout_details, shipping_details, survey_type, referrer_code")
      .eq("id", id)
      .single();

    const reg = (row?.registration as Record<string, string>) ?? {};
    const email = reg.email;

    if (email && row) {
      const r = row as Record<string, unknown>;

      if (updates.status === "verified" || updates.status === "rejected") {
        const defId = updates.status === "verified" ? "verified" : "rejected";
        const vars = defId === "verified" ? buildVerifiedVars(r) : {};
        sendEmail(email, defId, vars).catch((e) =>
          console.error(`QA ${defId} email error:`, e),
        );
      }

      if (updates.payout_status === "paid") {
        const surveyType = (r.survey_type as string) ?? "SME";
        const isTumbler = surveyType === "TSI";
        const defId = isTumbler ? "paid-tumbler" : "paid";
        const vars = isTumbler ? buildTumblerVars(r) : buildPaidVars(r, id);
        sendEmail(email, defId, vars).catch((e) =>
          console.error(`Paid email error (${defId}):`, e),
        );
      }
    }

    // Referrer bonus approved → notify the referrer.
    if (updates.referrer_payout_status === "approved" && row) {
      const r = row as Record<string, unknown>;
      const referrerCode = (r.referrer_code as string) ?? "";
      if (referrerCode) {
        const { data: refRow } = await db
          .from("referrer")
          .select("full_name, email")
          .eq("referral_code", referrerCode)
          .single();
        if (refRow?.email) {
          const surveyType = (r.survey_type as string) ?? "SME";
          const bonusAmt = DEFAULT_BONUS[surveyType] ?? 0;
          const reg2 = (r.registration as Record<string, string>) ?? {};
          const referredName = reg2.org || reg2.name || "—";
          const vars = {
            referredName,
            referralCode: referrerCode,
            bonusAmount: bonusAmt > 0 ? `₱${bonusAmt.toLocaleString()}` : "—",
          };
          sendEmail(refRow.email, "refbonus", vars).catch((e) =>
            console.error("Referrer bonus email error:", e),
          );
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
