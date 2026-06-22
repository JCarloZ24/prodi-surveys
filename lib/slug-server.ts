import { createAdminClient } from "@/lib/supabase-server";
import { slugify } from "@/lib/slug";

// Server-only slug helpers that query the profiles table.

// True when no profile currently uses this slug.
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const db = createAdminClient();
  const { data } = await db
    .from("profiles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return !data;
}

// Produce a slug from `name` that does not collide with an existing
// profiles.slug, appending -2, -3, … on conflict. Kept as a fallback; the
// unique constraint on profiles.slug is the final backstop against races.
export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "enumerator";
  const db = createAdminClient();

  const { data } = await db
    .from("profiles")
    .select("slug")
    .ilike("slug", `${base}%`);

  const taken = new Set((data ?? []).map((r) => r.slug).filter(Boolean));
  if (!taken.has(base)) return base;

  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
