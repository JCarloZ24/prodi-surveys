import { NextRequest, NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase";

// POST /api/selfie — upload an identity selfie to Supabase Storage
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are accepted." }, { status: 400 });
  }

  const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic", "heif", "avif"]);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeExt = ALLOWED_EXTS.has(ext) ? ext : "jpg";
  const path = `${crypto.randomUUID()}.${safeExt}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const db = createAnonClient();

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
