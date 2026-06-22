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
  const referenceNo = reg.generated_referral_code || "—";
  const tokenAmt = DEFAULT_TOKEN[surveyType] ?? 0;
  const tokenAmount = tokenAmt > 0 ? `₱${tokenAmt}` : "—";

  let payoutMethod = "—";
  if (pay?.acctNum) {
    payoutMethod = `${pay.method ?? ""} •••• ${String(pay.acctNum).slice(-3)}`;
  } else if (pay?.method) {
    payoutMethod = pay.method;
  } else if (ship) {
    const colorLabels: Record<string, string> = { grey: "Charcoal grey", blue: "Sky blue", black: "Black" };
    payoutMethod = `Tumbler · ${colorLabels[ship.color] ?? ship.color ?? "Grey"}`;
  }

  return { firstName, referenceNo, tokenAmount, payoutMethod };
}

async function sendQaEmail(
  toEmail: string,
  defId: "verified" | "rejected",
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

  // Send QA notification email for approve / reject actions.
  if (updates.status === "verified" || updates.status === "rejected") {
    const { data: row } = await db
      .from("submissions")
      .select("registration, payout_details, shipping_details, survey_type")
      .eq("id", id)
      .single();

    const reg = (row?.registration as Record<string, string>) ?? {};
    const email = reg.email;
    if (email) {
      const defId = updates.status === "verified" ? "verified" : "rejected";
      const vars = defId === "verified" ? buildVerifiedVars(row as Record<string, unknown>) : {};
      sendQaEmail(email, defId, vars).catch((e) =>
        console.error(`QA ${defId} email error:`, e),
      );
    }
  }

  return NextResponse.json({ ok: true });
}
