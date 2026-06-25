// Client-side report generation for the Reports / Export page. Builds real CSV
// content from the live portal state, role-aware: stakeholders never receive any
// monetary columns or the payout report.

import { payoutFor } from "./selectors";
import type { AuditEntry, Respondent, Role } from "./types";

function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of rows) lines.push(row.map(csvEscape).join(","));
  // BOM so Excel renders UTF-8 (the peso sign ₱) correctly.
  return "﻿" + lines.join("\r\n");
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export interface ReportInput {
  respondents: Respondent[];
  audit: AuditEntry[];
  surveyPayout: number;
  role: Role;
}

// Returns the file to download, or null when the report isn't available for the
// caller's role (e.g. a stakeholder requesting the payout report).
export function buildReport(
  name: string,
  fmt: string,
  { respondents, audit, surveyPayout, role }: ReportInput,
): { filename: string; content: string } | null {
  const money = role !== "stakeholder";
  const ext = fmt === "Excel" ? "xls" : "csv";
  const filename = `${slugify(name)}-${new Date().toISOString().slice(0, 10)}.${ext}`;

  // Shared respondent-list builder. The enumerator-payout columns (flat ₱400 per
  // verified survey) are appended only for non-stakeholder roles.
  const respondentTable = (list: Respondent[]): string => {
    const headers = [
      "Name", "Organization", "Type", "Region", "Position",
      "Email", "Mobile", "Mode", "Enumerator", "Status", "Referred by",
    ];
    if (money) headers.push("Enumerator payout", "Payout status", "Method");
    const rows = list.map((r) => {
      const base: (string | number)[] = [
        r.name, r.org, r.type, r.region, r.position,
        r.email, r.mobile, r.mode, r.enumerator, r.status, r.referredBy ?? "",
      ];
      if (money) {
        base.push(
          payoutFor(surveyPayout, r),
          r.payStatus ?? "—",
          r.method ?? "—",
        );
      }
      return base;
    });
    return toCsv(headers, rows);
  };

  switch (name) {
    case "Full respondent list":
      return { filename, content: respondentTable(respondents) };

    case "Verified respondents":
      return { filename, content: respondentTable(respondents.filter((r) => r.verified)) };

    case "Survey answers": {
      // KoboToolbox-style wide format: one row per submission, one column per
      // question label seen across all answered snapshots.
      const labels: string[] = [];
      const seen = new Set<string>();
      for (const r of respondents) {
        for (const [label] of r.snapshot ?? []) {
          if (!seen.has(label)) { seen.add(label); labels.push(label); }
        }
      }
      const headers = ["Name", "Organization", "Type", "Status", ...labels];
      const rows = respondents.map((r) => {
        const map = new Map((r.snapshot ?? []).map(([l, v]) => [l, v]));
        return [r.name, r.org, r.type, r.status, ...labels.map((l) => map.get(l) ?? "")];
      });
      return { filename, content: toCsv(headers, rows) };
    }

    case "Referral report": {
      // Attribution only — referrals no longer carry any bonus money.
      const list = respondents.filter((r) => r.referred);
      const headers = ["Referral code", "Referrer", "Respondent", "Organization", "Type", "Status", "Verified"];
      const rows = list.map((r) => [
        r.referrer ?? "", r.referredBy ?? "", r.name, r.org, r.type, r.status, r.verified ? "Yes" : "No",
      ]);
      return { filename, content: toCsv(headers, rows) };
    }

    case "Payout report": {
      // Enumerator payouts — flat ₱400 per verified survey. Not for stakeholders.
      if (!money) return null;
      const list = respondents.filter((r) => r.verified);
      const headers = ["Respondent", "Type", "Enumerator", "Enumerator payout", "Payout status", "Method"];
      const rows = list.map((r) => [
        r.name, r.type, r.enumerator,
        payoutFor(surveyPayout, r), r.payStatus ?? "—", r.method ?? "—",
      ]);
      return { filename, content: toCsv(headers, rows) };
    }

    case "Audit log": {
      const headers = ["Action", "Target", "By", "Time"];
      const rows = audit.map((a) => [a[0], a[1], a[2], a[3]]);
      return { filename, content: toCsv(headers, rows) };
    }

    default:
      return null;
  }
}
