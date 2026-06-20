export const PUBLIC_SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL || "https://prodigitalitydata.live";

export function publicUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : "/" + path;
  return PUBLIC_SITE_ORIGIN.replace(/\/$/, "") + normalizedPath;
}
