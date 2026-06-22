import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

// GET /api/enumerators — public, no auth. Returns approved enumerator names for
// the respondent-facing landing gate dropdown.
export async function GET() {
  const db = createAdminClient();
  const { data, error } = await db
    .from("profiles")
    .select("id, full_name")
    .eq("role", "enumerator")
    .eq("status", "approved")
    .order("full_name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ enumerators: data ?? [] });
}
