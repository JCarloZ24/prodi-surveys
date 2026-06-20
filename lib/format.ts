// Pure formatting + style helpers ported from the design prototype.
// The pill helpers return Tailwind class strings (idiomatic) in place of the
// inline style objects the prototype used.

import type { PayStatus, RespondentType } from "./types";

export function peso(n: number): string {
  return "₱" + Number(n).toLocaleString("en-PH");
}

export function initials(n: string): string {
  const p = (n || "").trim().split(/\s+/);
  return ((p[0] || "")[0] || "") + ((p[1] || "")[0] || "");
}

export function typeShort(t: string): string {
  return t === "AgriTech" ? "Agri-Tech" : t;
}

// Stable string hash (matches the prototype's `hash`).
export function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

// Short human-readable referral code (matches the prototype's `code`).
export function code(n: number): string {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let r = "";
  let x = Math.abs((n * 2654435761) % 100000);
  for (let i = 0; i < 4; i++) {
    r += c[x % c.length];
    x = Math.floor(x / 3) + i * 7;
  }
  return r;
}

// Avatar palette used for generated respondent records (10 colors).
const AVATAR_COLORS = [
  "#E0195F",
  "#7C3AED",
  "#2563EB",
  "#0891B2",
  "#059669",
  "#D97706",
  "#DB2777",
  "#4F46E5",
  "#0D9488",
  "#CA8A04",
];
export function avatarColor(s: string): string {
  return AVATAR_COLORS[Math.abs(hash(s)) % AVATAR_COLORS.length];
}

// Avatar palette used for referrers / enumerators (8 colors) — kept separate to
// match the prototype's distinct `colorPick`.
const PICK_COLORS = [
  "#E0195F",
  "#7C3AED",
  "#2563EB",
  "#0891B2",
  "#059669",
  "#D97706",
  "#DB2777",
  "#4F46E5",
];
export function colorPick(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return PICK_COLORS[Math.abs(h) % PICK_COLORS.length];
}

const PILL_BASE =
  "inline-block whitespace-nowrap rounded-md px-[9px] py-[3px] text-[11px] font-bold";

const STATUS_TONE: Record<string, string> = {
  New: "bg-gray-100 text-gray-600",
  "Email Verification Pending": "bg-amber-100 text-amber-800",
  "Email Verified": "bg-blue-100 text-blue-800",
  "Survey Started": "bg-indigo-100 text-indigo-800",
  "Survey Completed": "bg-sky-100 text-sky-800",
  "Selfie Submitted": "bg-cyan-100 text-cyan-800",
  "Pending QA": "bg-amber-100 text-amber-800",
  "Needs Follow-up": "bg-orange-100 text-orange-800",
  Verified: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};
export function statusPillClass(status: string): string {
  return `${PILL_BASE} ${STATUS_TONE[status] || "bg-gray-100 text-gray-600"}`;
}

const PAY_TONE: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Approved: "bg-blue-100 text-blue-800",
  Paid: "bg-green-100 text-green-800",
  Failed: "bg-red-100 text-red-800",
  "On Hold": "bg-gray-100 text-gray-600",
  "—": "bg-gray-100 text-gray-400",
};
export function payPillClass(status: PayStatus | string): string {
  return `${PILL_BASE} ${PAY_TONE[status] || "bg-gray-100 text-gray-600"}`;
}

const TYPE_TONE: Record<string, string> = {
  TSI: "bg-violet-100 text-violet-800",
  AgriTech: "bg-green-100 text-green-800",
  SME: "bg-rose-100 text-rose-800",
};
export function typePillClass(type: RespondentType | string): string {
  return `inline-block whitespace-nowrap rounded-[5px] px-2 py-0.5 text-[10.5px] font-bold ${
    TYPE_TONE[type] || "bg-gray-100 text-gray-600"
  }`;
}
