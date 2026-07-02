import { createAdminClient } from "@/lib/supabase-server";
import { SurveyPageClient } from "../SurveyPageClient";
import { InvalidSurveyLink } from "../InvalidSurveyLink";

// /s/<enumerator-slug> — the canonical survey link.
// The path segment is an approved enumerator's slug.
export default async function SurveyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const slug = decodeURIComponent(code).trim().toLowerCase();

  // The survey must be opened from a valid, approved enumerator's link.
  const db = createAdminClient();
  const { data: enumerator } = await db
    .from("profiles")
    .select("slug")
    .eq("slug", slug)
    .eq("role", "enumerator")
    .eq("status", "approved")
    .maybeSingle();

  if (!enumerator) {
    return <InvalidSurveyLink />;
  }

  return <SurveyPageClient slug={enumerator.slug ?? slug} />;
}
