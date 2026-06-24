// Google Forms-style aggregation of survey answers for the Reports page.
// Pure (no React) — walks the survey instrument for a path and summarizes the
// answers of every respondent on that path. All survey content, non-monetary.

import { surveyDef } from "./survey";
import type { Respondent, RespondentType } from "./types";

export interface OptionCount {
  label: string;
  count: number;
  pct: number; // share of `answered` for choice/matrix-row, 0..100
}

export interface MatrixRowSummary {
  row: string;
  options: OptionCount[];
}

export interface QuestionSummary {
  id: string;
  label: string;
  kind: "radio" | "select" | "multi" | "matrix" | "number" | "text";
  answered: number;
  // choice questions (radio/select/multi)
  options?: OptionCount[];
  // matrix questions
  scale?: string[];
  rows?: MatrixRowSummary[];
  // number questions
  numberStats?: { min: number; max: number; avg: number };
  // text questions
  texts?: string[];
}

// Builds option counts from an ordered option list plus any extra/unlisted values
// that appeared in the data (bucketed in first-seen order after the defined ones).
function tally(values: string[], defined: string[], answered: number): OptionCount[] {
  const counts = new Map<string, number>();
  for (const d of defined) counts.set(d, 0);
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const out: OptionCount[] = [];
  for (const [label, count] of counts) {
    out.push({ label, count, pct: answered ? Math.round((count / answered) * 100) : 0 });
  }
  return out;
}

export function aggregateResponses(
  respondents: Respondent[],
  path: RespondentType | string,
): QuestionSummary[] {
  const list = respondents.filter((r) => r.type === path);
  const out: QuestionSummary[] = [];

  for (const q of surveyDef(path)) {
    if (q.kind === "section" || !q.id || !q.label) continue;

    // Collect raw answers for this question id across the path's respondents.
    const raws = list.map((r) => (r.answers ?? {})[q.id as string]).filter((v) => v != null);

    if (q.kind === "radio" || q.kind === "select") {
      const values = raws.map((v) => String(v).trim()).filter(Boolean);
      out.push({
        id: q.id, label: q.label, kind: q.kind, answered: values.length,
        options: tally(values, q.opts ?? [], values.length),
      });
    } else if (q.kind === "multi") {
      const flat: string[] = [];
      let answered = 0;
      for (const v of raws) {
        const arr = Array.isArray(v) ? v.map(String).filter(Boolean) : [];
        if (arr.length) answered += 1;
        flat.push(...arr);
      }
      out.push({
        id: q.id, label: q.label, kind: "multi", answered,
        options: tally(flat, q.opts ?? [], answered),
      });
    } else if (q.kind === "matrix") {
      const scale = q.scale ?? [];
      const rows: MatrixRowSummary[] = (q.rows ?? []).map((row) => {
        const cellValues: string[] = [];
        for (const v of raws) {
          if (v && typeof v === "object" && !Array.isArray(v)) {
            const cell = (v as Record<string, unknown>)[row];
            if (cell != null && String(cell).trim()) cellValues.push(String(cell).trim());
          }
        }
        return { row, options: tally(cellValues, scale, cellValues.length) };
      });
      const answered = raws.filter((v) => v && typeof v === "object").length;
      out.push({ id: q.id, label: q.label, kind: "matrix", answered, scale, rows });
    } else if (q.kind === "number") {
      const nums = raws.map((v) => Number(v)).filter((n) => Number.isFinite(n));
      const numberStats = nums.length
        ? {
            min: Math.min(...nums),
            max: Math.max(...nums),
            avg: Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10,
          }
        : undefined;
      out.push({ id: q.id, label: q.label, kind: "number", answered: nums.length, numberStats });
    } else if (q.kind === "text") {
      const texts = raws.map((v) => String(v).trim()).filter(Boolean);
      out.push({ id: q.id, label: q.label, kind: "text", answered: texts.length, texts });
    }
  }

  return out;
}
