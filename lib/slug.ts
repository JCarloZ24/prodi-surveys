// Pure, isomorphic slug helpers (safe to import in client components).
// Server-only helpers that touch the DB live in lib/slug-server.ts.

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

// Valid handle: lowercase alphanumerics in hyphen-separated groups, 3–48 chars.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function isValidSlug(slug: string): boolean {
  return slug.length >= 3 && slug.length <= 48 && SLUG_RE.test(slug);
}

// Suggest a few candidate handles derived from a full name, e.g.
// "Maria Santos" → ["maria-santos", "msantos", "maria-s", "santos-maria"].
export function slugSuggestions(fullName: string): string[] {
  const base = slugify(fullName);
  if (!base) return [];

  const parts = base.split("-").filter(Boolean);
  const first = parts[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1] : "";

  const candidates = [base];
  if (first && last) {
    candidates.push(`${first[0]}${last}`);
    candidates.push(`${first}-${last[0]}`);
    candidates.push(`${last}-${first}`);
  }
  candidates.push(`${base}-1`);

  // Dedupe, keep only valid handles, cap to a small set.
  return [...new Set(candidates)].filter(isValidSlug).slice(0, 4);
}
