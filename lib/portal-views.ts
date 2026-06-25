import type { Role, ViewKey } from "@/lib/types";

// Pure (JSX-free) view/permission helpers shared by the client shell and the
// server route files. Keep in sync with the NAV list in StaffPortal.tsx.

export const VIEW_KEYS: ViewKey[] = [
  "dashboard",
  "respondents",
  "qa",
  "payouts",
  "enumerators",
  "stakeholders",
  "referrers",
  "reports",
  "emails",
  "audit",
  "settings",
];

// Views a stakeholder may access (read-only, non-financial subset).
export const ALLOWED_STAKEHOLDER: ViewKey[] = [
  "dashboard",
  "reports",
];

// Views an enumerator may access. They view respondents only — QA Review,
// Payouts, Referrers, and the admin account pages are admin-only.
export const ALLOWED_ENUMERATOR: ViewKey[] = [
  "dashboard",
  "respondents",
];

// Account-management views only an admin may access.
export const ADMIN_ONLY: ViewKey[] = ["enumerators", "stakeholders", "referrers"];

export function allowedViews(role: Role): ViewKey[] {
  if (role === "stakeholder") return VIEW_KEYS.filter((v) => ALLOWED_STAKEHOLDER.includes(v));
  if (role === "admin") return VIEW_KEYS;
  // enumerator: dashboard and respondents only.
  return VIEW_KEYS.filter((v) => ALLOWED_ENUMERATOR.includes(v));
}

export function isViewAllowed(role: Role, view: string): view is ViewKey {
  return allowedViews(role).includes(view as ViewKey);
}

export function isRole(value: string): value is Role {
  return value === "admin" || value === "enumerator" || value === "stakeholder";
}

export function defaultView(): ViewKey {
  return "dashboard";
}
