// Base URL for the respondent-facing survey app (survey.prodigitalitydata.live)
export const PUBLIC_SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.prodigitalitydata.live";

// Base URL for the admin portal (admin.prodigitalitydata.live)
export const PORTAL_ORIGIN =
  process.env.NEXT_PUBLIC_PORTAL_URL || "https://www.prodigitalitydata.live/portal/login";

export function publicUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : "/" + path;
  return PUBLIC_SITE_ORIGIN.replace(/\/$/, "") + normalizedPath;
}

export function portalUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : "/" + path;
  return PORTAL_ORIGIN.replace(/\/$/, "") + normalizedPath;
}

// Path a respondent shares to refer someone. When they were enrolled through an
// enumerator (slug present), the link routes through that same enumerator and
// carries their referral code, preserving enumerator attribution. Falls back to
// the legacy /r/<code> entry when there is no enumerator slug.
export function respondentReferralPath(slug: string, code: string) {
  const c = encodeURIComponent(code || "");
  return slug ? `/s/${slug}?referral-code=${c}` : `/r/${c}`;
}
