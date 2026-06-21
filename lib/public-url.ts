// Base URL for the respondent-facing survey app (survey.prodigitalitydata.live)
export const PUBLIC_SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL || "https://survey.prodigitalitydata.live";

// Base URL for the admin portal (admin.prodigitalitydata.live)
export const PORTAL_ORIGIN =
  process.env.NEXT_PUBLIC_PORTAL_URL || "https://admin.prodigitalitydata.live";

export function publicUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : "/" + path;
  return PUBLIC_SITE_ORIGIN.replace(/\/$/, "") + normalizedPath;
}

export function portalUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : "/" + path;
  return PORTAL_ORIGIN.replace(/\/$/, "") + normalizedPath;
}
