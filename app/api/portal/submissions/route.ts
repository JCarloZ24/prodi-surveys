import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { rowsToRespondents, buildEnumSlugMap } from "@/lib/submission-mapper";

export async function GET() {
  const me = await getProfile();
  if (!me || me.status !== "approved") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const [{ data, error }, { data: enumProfiles }] = await Promise.all([
    db
      .from("submissions")
      .select("*")
      .neq("survey_type", "lead")
      .neq("status", "started")
      .order("created_at", { ascending: false }),
    db.from("profiles").select("slug, full_name").eq("role", "enumerator"),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const enumBySlug = buildEnumSlugMap(enumProfiles ?? []);
  let respondents = rowsToRespondents(
    (data ?? []).map((row) => row as Record<string, unknown>),
    enumBySlug,
  );
  // Full payout numbers + account names are admin-only — strip for other roles.
  if (me.role !== "admin") {
    respondents = respondents.map((r) => ({ ...r, acctNum: "", acctName: "" }));
  }

  return NextResponse.json({ respondents });
}
