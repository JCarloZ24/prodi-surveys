import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";

// GET /api/portal/users — admin-only list of profiles, optionally filtered by
// ?status=pending|approved|rejected and ?role=admin|enumerator|stakeholder.
export async function GET(req: NextRequest) {
  const me = await getProfile();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status");
  const role = req.nextUrl.searchParams.get("role");

  const db = createAdminClient();
  let query = db.from("profiles").select("*").order("created_at", { ascending: false });
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    query = query.eq("status", status as "pending" | "approved" | "rejected");
  }
  if (role && ["admin", "enumerator", "stakeholder"].includes(role)) {
    query = query.eq("role", role as "admin" | "enumerator" | "stakeholder");
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users: data ?? [] });
}
