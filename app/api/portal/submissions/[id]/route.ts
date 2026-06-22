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
  const ship = (row.shipping_details as Record<string, string> | null) ?? null;
  const surveyType = (row.survey_type as string) ?? "SME";

  const firstName = (reg.name ?? "").split(" ")[0] || "there";
  const colorLabels: Record<string, string> = { grey: "Charcoal grey", blue: "Sky blue", black: "Black" };

  let tokenAmount: string;
  let payoutMethod: string;

  if (surveyType === "TSI" && ship) {
    // TSI: token row shows tumbler color, payout method row is hidden (empty = skipped by renderer)
    tokenAmount = `Tumbler · ${colorLabels[ship.color] ?? ship.color ?? "Grey"}`;
    payoutMethod = "";
  } else {
    const tokenAmt = DEFAULT_TOKEN[surveyType] ?? 0;
    tokenAmount = tokenAmt > 0 ? `₱${tokenAmt}` : "—";
    if (pay?.acctNum) {
      payoutMethod = `${pay.method ?? ""} •••• ${String(pay.acctNum).slice(-3)}`;
    } else if (pay?.method) {
      payoutMethod = pay.method;
    } else {
      payoutMethod = "—";
    }
  }

  return { firstName, tokenAmount, payoutMethod };
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
  const ship = (row.shipping_details as Record<string, string> | null) ?? null;

  const shippedTo = reg.name ?? "—";
  const colorLabels: Record<string, string> = { grey: "Charcoal grey", blue: "Sky blue", black: "Black" };
  const color = ship?.color ?? "grey";
  const item = `Branded tumbler · ${colorLabels[color] ?? color}`;
  const estDelivery = "7–14 business days";

  return { shippedTo, item, estDelivery };
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
      .select("registration, payout_details, shipping_details, survey_type")
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
  }

  return NextResponse.json({ ok: true });
}
