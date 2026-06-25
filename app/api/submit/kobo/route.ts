import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

// POST /api/submit/kobo — record the external Kobo survey timing on the respondent's
// already-created submission row: kobo_start when the Survey step loads, kobo_end when
// they continue to Selfie. This persists the timing immediately (rather than only at
// final submit), so a response abandoned mid-survey still captures when it started.
//
// Public + service-role like the other /api/submit routes; it updates ONLY the kobo
// timestamps, keyed by the submission's unguessable UUID.
export async function POST(req: NextRequest) {
  const { id, kobo_start, kobo_end } = await req.json().catch(() => ({}));
  if (!id || (!kobo_start && !kobo_end)) {
    return NextResponse.json({ error: "id and a kobo timestamp are required" }, { status: 400 });
  }

  const db = createAdminClient();
  const updated_at = new Date().toISOString();

  // kobo_start is set once (the first time the survey loads); the `.is(null)` guard
  // means re-mounts / back-navigation never overwrite the original start time.
  if (kobo_start) {
    const { error } = await db
      .from("submissions")
      .update({ kobo_start, updated_at })
      .eq("id", id)
      .is("kobo_start", null);
    if (error) {
      console.error("kobo_start update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // kobo_end always reflects the latest continue out of the survey step.
  if (kobo_end) {
    const { error } = await db
      .from("submissions")
      .update({ kobo_end, updated_at })
      .eq("id", id);
    if (error) {
      console.error("kobo_end update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
