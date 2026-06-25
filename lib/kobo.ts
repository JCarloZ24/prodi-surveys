// KoboToolbox (Enketo) survey embedding.
//
// Each respondent path links to a separate deployed Kobo form. The respondent
// fills out the survey inside an embedded iframe; on submit, the Enketo iframe
// posts a `{ enketoEvent: "submissionsuccess" }` message to this window, which
// the Survey step listens for to unlock the next step.
//
// The forms live on the global KoboToolbox instance, so the iframe origin is
// ee.kobotoolbox.org. Update the ids here if a form is redeployed.

import type { RespondentType } from "./types";

export const KOBO_ENKETO_ORIGIN = "https://ee.kobotoolbox.org";

// Enketo "/i/" (iframe) embed ids per respondent path, from each form's
// Collect data → "Embeddable HTML code" in KoboToolbox.
//   SME  → "CRAFTS: Survey for SME"
//   TSI  → "CRAFTS: Survey for TSI"
//   AgriTech → "CRAFTS: Survey for AFTP"  ← assumed mapping; confirm with client.
const KOBO_FORM_ID: Record<RespondentType, string> = {
  SME: "1HYbQBkx",
  AgriTech: "jFeB75ik",
  TSI: "tJXoThDF",
};

// Data column name of the hidden field each Kobo form carries so a response can
// be matched back to its respondent. Pre-filled via `?d[ref_id]=<submissionId>`
// (Kobo uses the data column name, not the XForm XPath). If the field is ever
// moved into a group, change this to "<group>/ref_id".
const KOBO_REF_FIELD = "ref_id";

// Build the iframe src for a respondent path. `origin` is this app's
// window.location.origin — Enketo needs it to post submission events back to the
// parent window. `refId` (our submission id) pre-fills the hidden ref_id field so
// the Kobo response can be reconciled with the respondent record. Forks disagree
// on the origin param spelling, so send both; unknown query params are ignored.
export function koboEmbedUrl(
  type: RespondentType | string,
  origin?: string,
  refId?: string,
): string {
  const id = KOBO_FORM_ID[type as RespondentType] ?? KOBO_FORM_ID.SME;
  const base = `${KOBO_ENKETO_ORIGIN}/i/${id}`;
  const params: string[] = [];
  if (origin) {
    const enc = encodeURIComponent(origin);
    params.push(`parentWindowOrigin=${enc}`, `parent_window_origin=${enc}`);
  }
  // Brackets stay literal (Kobo pre-fill syntax); only the value is encoded.
  if (refId) params.push(`d[${KOBO_REF_FIELD}]=${encodeURIComponent(refId)}`);
  return params.length ? `${base}?${params.join("&")}` : base;
}

// True when an Enketo postMessage signals a successful submission. Tolerates the
// object form ({ enketoEvent: "submissionsuccess" }) and string/JSON variants so
// the gate stays reliable across Enketo versions.
export function isKoboSubmitSuccess(data: unknown): boolean {
  if (!data) return false;
  if (typeof data === "object") {
    const evt = (data as { enketoEvent?: unknown }).enketoEvent;
    return typeof evt === "string" && /submission ?success/i.test(evt);
  }
  if (typeof data === "string") {
    try {
      const parsed: unknown = JSON.parse(data);
      if (parsed && typeof parsed === "object") return isKoboSubmitSuccess(parsed);
    } catch {
      /* not JSON — fall through to string match */
    }
    return /submission ?success/i.test(data);
  }
  return false;
}
