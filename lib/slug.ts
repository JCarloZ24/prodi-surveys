import { createAdminClient } from "@/lib/supabase-server";

// Turn a name into a URL-safe slug: lowercase, ASCII words joined by hyphens.
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

// Produce a slug from `name` that does not collide with an existing
// profiles.slug, appending -2, -3, … on conflict. The unique constraint on
// profiles.slug is the final backstop against races.
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
