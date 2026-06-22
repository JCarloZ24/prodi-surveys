import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import { rowToRespondent } from "@/lib/submission-mapper";

export async function GET() {
  const me = await getProfile();
  if (!me || me.status !== "approved") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const respondents = (data ?? []).map((row, i) =>
    rowToRespondent(row as Record<string, unknown>, i)
  );

  return NextResponse.json({ respondents });
}
