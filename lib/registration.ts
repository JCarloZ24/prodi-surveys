// Canonical Register-step question labels + the serializer that turns the in-memory
// camelCase `Registration` into the human-readable shape persisted to
// submissions.registration_data. Keys are the actual fields the respondent filled in,
// so a stored row reads as the registration form rather than cryptic keys.

import type { Registration } from "./types";

// The exact registration-field labels, keyed by their Registration field.
export const REG_Q = {
  name: "Full name",
  email: "Email address",
  mobile: "Mobile number",
  org: "Organization",
} as const;

// Build the persisted registration_data: a labeled map of the respondent's
// registration details. Optional unfilled fields (e.g. org) are kept as "".
export function buildRegistrationData(reg: Registration): Record<string, string> {
  return {
    [REG_Q.name]: reg.name || "",
    [REG_Q.email]: reg.email || "",
    [REG_Q.mobile]: reg.mobile || "",
    [REG_Q.org]: reg.org || "",
  };
}
