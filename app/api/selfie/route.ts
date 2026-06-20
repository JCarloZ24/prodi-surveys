import { NextRequest, NextResponse } from "next/server";
import { supabase as db } from "@/lib/supabase";

// POST /api/selfie — upload an identity selfie to Supabase Storage
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await db.storage.from("selfies").upload(path, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });

  if (error) {
    console.error("Selfie upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = db.storage.from("selfies").getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl });
}
