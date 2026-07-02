// Shared domain types for the Prodi-Surveys portal.
// These describe the mock data shapes today; a future API can produce the same
// shapes so the components/store never need to change.

export type Role = "admin" | "enumerator" | "stakeholder";

export type AppMode = "login" | "portal" | "flow";

export type RespondentType = "TSI" | "AgriTech" | "SME";

// Every survey is enumerator-assisted — respondents reach the survey only through
// an enumerator's link (/s/[slug]). Self-service collection no longer exists.
export type CollectionMode = "Enumerator-assisted";

export type RespondentStatus =
  | "New"
  | "Email Verification Pending"
  | "Email Verified"
  | "Survey Started"
  | "Survey Completed"
  | "Selfie Submitted"
  | "Pending QA"
  | "Needs Follow-up"
  | "Verified"
  | "Rejected";

export type PayStatus =
  | "Pending"
  | "Approved"
  | "Paid"
  | "Failed"
  | "On Hold"
  | "—";

export type ViewKey =
  | "dashboard"
  | "respondents"
  | "qa"
  | "payouts"
  | "enumerators"
  | "stakeholders"
  | "reports"
  | "emails"
  | "audit"
  | "settings";

export interface Respondent {
  id: number;
  name: string;
  org: string;
  type: RespondentType;
  status: RespondentStatus | string;
  position: string;
  email: string;
  mobile: string;
  emailV: boolean;
  surveyDone: boolean;
  selfie: boolean;
  verified: boolean;
  mode: CollectionMode;
  enumerator: string;
  // Enumerator payout status for this survey's flat ₱400 (Verified → Pending → Paid).
  payStatus: PayStatus | string;
  method: string;
  acct: string;
  // Full payout number (mobile / account / reference) + account name. Admin-only:
  // redacted to "" for non-admin viewers before the record reaches the client.
  acctNum?: string;
  acctName?: string;
  compMin: number;
  flags: string[];
  // Live survey answers for the QA drawer snapshot — [question label, answer text].
  snapshot?: [string, string][];
  // Raw survey answers keyed by question id (the JSONB blob) — used by the survey
  // responses report for option-level / matrix aggregation. Survey content only.
  answers?: Record<string, unknown>;
  createdDays: number;
  // ISO timestamp of submission (created_at) — used by the reports date dimension.
  submittedAt?: string;
  color: string;
  // Supabase row UUID — present on records fetched from DB, absent on locally-created ones.
  supabaseId?: string;
  selfieUrl?: string;
  // Added when a respondent is created through the survey flow.
  assignedType?: string;
  qualStatus?: string;
  selfieMethod?: string;
  payoutOn?: boolean;
  // Respondent token payout (₱ cash for SME/Agri-Tech, tumbler for TSI), tracked
  // independently of the enumerator payStatus. Pending → Approved → Paid / On Hold.
  respondentPayStatus?: PayStatus | string;
  respondentPaidDate?: string;
  // TSI tumbler shipping details (admin-only: address/phone/recipient redacted for others).
  tumblerColor?: string;
  shipRecipient?: string;
  shipPhone?: string;
  shipAddress?: string;
  _new?: boolean;
}

// Audit rows are kept as a compact tuple, matching the design's seed format:
// [action, target, by, time, bgColor, fgColor, iconKey]
export type AuditEntry = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

export interface Enumerator {
  name: string;
  email: string;
}

export type Targets = Record<RespondentType, number>;

export interface Qual {
  orgType: "" | "gov" | "tech" | "food" | "other";
  govOrg: string;
  govDept: string;
  govSupports: string;
  techTypes: string[];
  techSells: string;
  foodMakes: string;
  foodProducts: string;
  foodEmployees: string;
  foodRole: string;
  orgName: string;
}

export interface Registration {
  name: string;
  email: string;
  mobile: string;
  org: string;
  position: string;
  type: RespondentType;
  enumerator?: string;
}

export interface PayoutDetails {
  method: string;
  acctName: string;
  acctNum: string;
  bank: string;
}

export type TumblerColor = "grey" | "blue" | "black";

export interface ShippingDetails {
  color: TumblerColor;
  useMyDetails: boolean;
  recipientName: string;
  recipientPhone: string;
  address: string;
}

export interface Classification {
  assignedType: string;
  status: string;
  flags: string[];
  surveyType: string;
}

// ---- Survey instrument ----
export type QuestionKind =
  | "section"
  | "radio"
  | "multi"
  | "select"
  | "number"
  | "text"
  | "matrix";

export interface SurveyQuestion {
  kind: QuestionKind;
  id?: string;
  label?: string;
  title?: string; // for sections
  opts?: string[];
  rows?: string[]; // for matrix
  scale?: string[]; // for matrix
  ph?: string; // placeholder for number/text
}

// ---- Email templates ----
export type EmailBlockType =
  | "h"
  | "p"
  | "btn"
  | "code"
  | "linkbox"
  | "kv"
  | "bullets"
  | "note"
  | "divider";

export interface EmailBlock {
  type: EmailBlockType;
  text?: string;
  rows?: [string, string][];
  items?: string[];
}

export interface EmailDef {
  id: string;
  audience: "Respondent" | "Enumerator" | "Stakeholder";
  name: string;
  subject: string;
  from: string;
  to: string;
  preheader?: string;
  accent: string;
  blocks: EmailBlock[];
  /** Sample values for {{variable}} placeholders in block text/rows/items */
  vars?: Record<string, string>;
}
