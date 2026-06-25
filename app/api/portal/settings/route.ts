import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { getAppSettings, DEFAULT_TARGETS } from "@/lib/settings";
import type { Targets } from "@/lib/types";

// GET /api/portal/settings — current portal settings (admin only).
export async function GET() {
  const me = await getProfile();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await getAppSettings());
}

// POST /api/portal/settings — update the singleton settings row (admin only).
export async function POST(req: NextRequest) {
  const me = await getProfile();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const surveyPayout = Math.max(0, Math.round(Number(body.surveyPayout) || 0));
  const rawTargets = body.targets ?? {};
  const targetNum = (v: unknown, d: number) =>
    typeof v === "number" && v >= 0 ? Math.round(v) : d;
  const targets: Targets = {
    TSI: targetNum(rawTargets.TSI, DEFAULT_TARGETS.TSI),
    AgriTech: targetNum(rawTargets.AgriTech, DEFAULT_TARGETS.AgriTech),
    SME: targetNum(rawTargets.SME, DEFAULT_TARGETS.SME),
  };

  const db = createAdminClient();
  const { error } = await db
    .from("app_settings")
    .update({ survey_payout: surveyPayout, targets, updated_at: new Date().toISOString() })
    .eq("id", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, surveyPayout, targets });
}
