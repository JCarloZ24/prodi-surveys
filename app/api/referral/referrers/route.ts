import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

// GET /api/referral/referrers — public, safe-subset list of referrers for the
// survey's "Referrer" dropdown. Returns only name + code + type (never the
// contact or payout details). The table is RLS-locked, so this server route
// (service-role) is how the public flow reads it.
export async function GET() {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from("referrer")
      .select("full_name, referral_code, type")
      .order("full_name", { ascending: true });

    if (error) {
      console.error("referrers list error:", error);
      return NextResponse.json({ referrers: [] }, { status: 500 });
    }
    return NextResponse.json({ referrers: data ?? [] });
  } catch (e) {
    console.error("referrers list error:", e);
    return NextResponse.json({ referrers: [] }, { status: 500 });
  }
}
