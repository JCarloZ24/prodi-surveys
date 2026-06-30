import type { ReactNode } from "react";

// Line-icon set ported from the design prototype's `icon(name, size)` factory.
export type IconName =
  | "dashboard"
  | "respondents"
  | "surveys"
  | "qa"
  | "payouts"
  | "enumerators"
  | "reports"
  | "audit"
  | "settings"
  | "csv"
  | "emails"
  | "flag";

const PATHS: Record<IconName, ReactNode> = {
  dashboard: (
    <>
      <rect x={3} y={3} width={7} height={7} rx={1.6} />
      <rect x={14} y={3} width={7} height={7} rx={1.6} />
      <rect x={14} y={14} width={7} height={7} rx={1.6} />
      <rect x={3} y={14} width={7} height={7} rx={1.6} />
    </>
  ),
  respondents: (
    <>
      <circle cx={12} cy={8} r={4} />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </>
  ),
  surveys: (
    <>
      <rect x={5} y={3} width={14} height={18} rx={2} />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </>
  ),
  qa: (
    <>
      <path d="M12 3l8 3v5c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  payouts: (
    <>
      <rect x={3} y={6} width={18} height={13} rx={2} />
      <path d="M3 10h18" />
      <path d="M16 14.5h2" />
    </>
  ),
  enumerators: (
    <>
      <circle cx={10} cy={8} r={4} />
      <path d="M3 20a7 7 0 0 1 11-5.6" />
      <path d="M16 11l2 2 4-4" />
    </>
  ),
  reports: (
    <>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M12 11v6" />
      <path d="M9 14l3 3 3-3" />
    </>
  ),
  audit: (
    <>
      <path d="M8 5h12" />
      <path d="M8 10h12" />
      <path d="M8 15h12" />
      <path d="M8 20h12" />
      <circle cx={3.5} cy={5} r={1} />
      <circle cx={3.5} cy={10} r={1} />
      <circle cx={3.5} cy={15} r={1} />
      <circle cx={3.5} cy={20} r={1} />
    </>
  ),
  settings: (
    <>
      <path d="M4 8h9" />
      <path d="M17 8h3" />
      <path d="M4 16h3" />
      <path d="M11 16h9" />
      <circle cx={15} cy={8} r={2} />
      <circle cx={7} cy={16} r={2} />
    </>
  ),
  csv: (
    <>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
    </>
  ),
  emails: (
    <>
      <rect x={3} y={5} width={18} height={14} rx={2} />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  flag: (
    <>
      <path d="M4 21V4" />
      <path d="M4 4h13l-2 4 2 4H4" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
}: {
  name: IconName;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name] ?? PATHS.dashboard}
    </svg>
  );
}

// The Prodi-Surveys hexagon logomark used across the chrome and emails.
export function LogoMark({
  size = 30,
  gradientId = "pg",
}: {
  size?: number;
  gradientId?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ flex: "none" }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F0246A" />
          <stop offset="1" stopColor="#FB923C" />
        </linearGradient>
      </defs>
      <path
        d="M20 2.5 L34.7 11 V29 L20 37.5 L5.3 29 V11 Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M14 11.5h7.5c3.6 0 6 2.2 6 5.6s-2.4 5.7-6 5.7H18v5.7h-4Zm4 3.4v4.5h3c1.5 0 2.4-.8 2.4-2.2s-.9-2.3-2.4-2.3Z"
        fill="#fff"
      />
    </svg>
  );
}
