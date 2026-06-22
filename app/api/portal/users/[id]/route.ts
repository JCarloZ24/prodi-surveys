import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase-server";
import type { Database } from "@/lib/database.types";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

// PATCH /api/portal/users/[id] — admin-only approve/reject of a pending account.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getProfile();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    action?: "approve" | "reject";
    reason?: string;
  };

  const updates: ProfileUpdate = { updated_at: new Date().toISOString() };

  if (body.action === "approve") {
    updates.status = "approved";
    updates.approved_at = new Date().toISOString();
    updates.approved_by = me.id;
    updates.rejected_reason = null;
  } else if (body.action === "reject") {
    updates.status = "rejected";
    updates.rejected_reason = body.reason?.trim() || null;
    updates.approved_at = null;
    updates.approved_by = null;
  } else {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ user: data });
}
