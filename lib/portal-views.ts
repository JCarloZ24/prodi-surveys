import type { Role, ViewKey } from "@/lib/types";

// Pure (JSX-free) view/permission helpers shared by the client shell and the
// server route files. Keep in sync with the NAV list in StaffPortal.tsx.

export const VIEW_KEYS: ViewKey[] = [
  "dashboard",
  "respondents",
  "referrals",
  "qa",
  "payouts",
  "enumerators",
  "stakeholders",
  "reports",
  "emails",
  "audit",
  "settings",
];

// Views a stakeholder may access (read-only subset).
export const ALLOWED_STAKEHOLDER: ViewKey[] = [
  "dashboard",
  "respondents",
  "referrals",
  "reports",
  "audit",
];

// Account-management views only an admin may access.
export const ADMIN_ONLY: ViewKey[] = ["enumerators", "stakeholders"];

export function allowedViews(role: Role): ViewKey[] {
  if (role === "stakeholder") return VIEW_KEYS.filter((v) => ALLOWED_STAKEHOLDER.includes(v));
  if (role === "admin") return VIEW_KEYS;
  // enumerator: everything except the admin-only account pages.
  return VIEW_KEYS.filter((v) => !ADMIN_ONLY.includes(v));
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
