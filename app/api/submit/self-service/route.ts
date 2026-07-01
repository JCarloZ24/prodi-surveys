import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { generateAccessCode } from "@/lib/access-code";
import { publicUrl } from "@/lib/public-url";

// POST /api/submit/self-service — attach an unguessable access code + resume_state to
// an existing draft submission so the respondent can finish the survey themselves via
// /s/<enumerator-slug>/<access_code>. Called when the enumerator picks "self-service"
// after the Register step (the row already exists from /api/submit/start).
//
// Idempotent: if the row already has an access_code, the existing one is returned
// (never rotated) so a link that was already copied or emailed stays valid.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, reg, qual, rType } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing submission id" }, { status: 400 });
  }

  const db = createAdminClient();

  const { data: row, error: loadError } = await db
    .from("submissions")
    .select("id, status, access_code, enumerator_slug")
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    console.error("Self-service load error:", loadError);
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }
  if (row.status === "submitted") {
    return NextResponse.json({ error: "Survey already submitted" }, { status: 409 });
  }

  const buildUrl = (code: string) =>
    publicUrl("/s/" + encodeURIComponent(row.enumerator_slug ?? "") + "/" + code);

  // Already has a code → return it unchanged (idempotent).
  if (row.access_code) {
    return NextResponse.json({ code: row.access_code, url: buildUrl(row.access_code) });
  }

  const resume_state = { reg: reg ?? null, qual: qual ?? null, rType: rType ?? null };

  // Generate + persist, retrying on the (astronomically unlikely) unique collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateAccessCode();
    const { data, error } = await db
      .from("submissions")
      .update({ access_code: code, resume_state })
      .eq("id", id)
      .is("access_code", null) // guard against a concurrent writer
      .select("access_code")
      .maybeSingle();

    if (!error && data?.access_code) {
      return NextResponse.json({ code: data.access_code, url: buildUrl(data.access_code) });
    }

    // Unique-violation → try a fresh code. Any other error → surface it.
    if (error && error.code !== "23505") {
      console.error("Self-service update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // A concurrent writer set the code first — re-read and return theirs.
    if (!error && !data) {
      const { data: reread } = await db
        .from("submissions")
        .select("access_code")
        .eq("id", id)
        .maybeSingle();
      if (reread?.access_code) {
        return NextResponse.json({ code: reread.access_code, url: buildUrl(reread.access_code) });
      }
    }
  }

  return NextResponse.json({ error: "Could not generate a unique code" }, { status: 500 });
}
