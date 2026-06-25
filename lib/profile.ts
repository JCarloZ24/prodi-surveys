// Canonical profile (qualification) question labels + the serializer that turns the
// in-memory camelCase `Qual` into the human-readable, path-filtered shape persisted
// to submissions.profiles_data. Keys are the actual questions the respondent saw, and
// only the chosen org path's questions are included (optional blanks become "").
//
// ProfileStep renders its question text from these same constants, so the stored
// question can never drift from what was displayed.

import type { Qual } from "./types";

// Full descriptive title for each org-type card — also the value stored for the
// "What kind of organization do you work for?" question.
export const ORG_TYPE_LABELS: Record<Qual["orgType"], string> = {
  "": "",
  gov: "Government or Business Support Organization",
  tech: "Technology, Equipment, or Service Provider",
  food: "Food Processing Business",
  other: "Other",
};

// The exact question-label strings, keyed by their Qual field. Single source of
// truth for both display (ProfileStep) and persistence (buildProfileData).
export const PROFILE_Q = {
  orgType: "What kind of organization do you work for?",
  govOrg: "Which organization do you work for?",
  govDept: "What department, office, or unit are you part of?",
  govSupports: "Does your organization help businesses grow, improve, export, or access support services?",
  orgName: "Organization / business name",
  techTypes: "Which best describes your organization?",
  techSells: "Do you sell products or services to food manufacturers or food processing businesses?",
  foodMakes: "Does your business make, process, manufacture, or package food products?",
  foodProducts: "What products does your business produce?",
  foodEmployees: "How many employees does your business have?",
  foodRole: "What is your role in the organization?",
  hearAbout: "How did you hear about this survey?",
  referrer: "Referrer",
  hearAboutOther: "How did you hear about this survey? (details)",
} as const;

// Build the persisted profiles_data: an ordered question→answer map containing only
// the questions for `qual.orgType`. Optional unanswered fields are kept as "".
export function buildProfileData(qual: Qual): Record<string, string> {
  const out: Record<string, string> = {
    [PROFILE_Q.orgType]: ORG_TYPE_LABELS[qual.orgType] ?? "",
  };

  if (qual.orgType === "gov") {
    out[PROFILE_Q.govOrg] = qual.govOrg || "";
    out[PROFILE_Q.govDept] = qual.govDept || "";
    out[PROFILE_Q.govSupports] = qual.govSupports || "";
  } else if (qual.orgType === "tech") {
    out[PROFILE_Q.orgName] = qual.orgName || "";
    out[PROFILE_Q.techTypes] = (qual.techTypes || []).join(", ");
    out[PROFILE_Q.techSells] = qual.techSells || "";
  } else if (qual.orgType === "food") {
    out[PROFILE_Q.orgName] = qual.orgName || "";
    out[PROFILE_Q.foodMakes] = qual.foodMakes || "";
    out[PROFILE_Q.foodProducts] = qual.foodProducts || "";
    out[PROFILE_Q.foodEmployees] = qual.foodEmployees || "";
    out[PROFILE_Q.foodRole] = qual.foodRole || "";
  } else if (qual.orgType === "other") {
    out[PROFILE_Q.orgName] = qual.orgName || "";
  }

  // "How did you hear about this survey?" is asked on the gov/tech/food paths.
  if (qual.orgType === "gov" || qual.orgType === "tech" || qual.orgType === "food") {
    out[PROFILE_Q.hearAbout] = qual.hearAbout || "";
    if (qual.hearAbout === "Friend or Referral") {
      out[PROFILE_Q.referrer] = qual.refName || "";
    } else if (qual.hearAbout === "Other") {
      out[PROFILE_Q.hearAboutOther] = qual.refName || "";
    }
  }

  return out;
}
