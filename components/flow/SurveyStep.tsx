"use client";

import { useState } from "react";
import { usePortal } from "@/lib/store";
import { surveyDef } from "@/lib/survey";
import { typePillClass, typeShort } from "@/lib/format";
import type { SurveyQuestion } from "@/lib/types";
import { RadioOption, MultiOption } from "./Options";
import { FlowNav } from "./FlowNav";

// A question counts as answered when it has a value. For a matrix, every row
// must have a selection (each row offers a "Not applicable" escape).
function isAnswered(q: SurveyQuestion, v: unknown): boolean {
  if (q.kind === "matrix") {
    const obj = v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, string>) : {};
    return (q.rows || []).every((r) => !!obj[r]);
  }
  if (v == null || v === "") return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
}

export function SurveyStep() {
  const { state, actions } = usePortal();
  const qs = surveyDef(state.rType);
  const [attempted, setAttempted] = useState(false);

  // Required = single-answer questions (radio/select/number/matrix) outside any
  // section flagged "(optional)". Open-ended text and "select all that apply"
  // multis stay optional, so respondents are never trapped by a question that
  // may legitimately have no answer.
  const required = qs.reduce(
    (acc, q) => {
      const optionalSection =
        q.kind === "section" ? /optional/i.test(q.title || "") : acc.optionalSection;
      const isRequired =
        q.kind !== "section" &&
        !acc.optionalSection &&
        (q.kind === "radio" || q.kind === "select" || q.kind === "number" || q.kind === "matrix");

      return {
        optionalSection,
        values: [...acc.values, isRequired],
      };
    },
    { optionalSection: false, values: [] as boolean[] },
  ).values;

  const firstMissing = qs.findIndex(
    (q, i) => required[i] && !isAnswered(q, state.survey[q.id as string]),
  );
  const complete = firstMissing === -1;

  const handleNext = () => {
    if (complete) {
      actions.flowNext();
      return;
    }
    setAttempted(true);
    const el = document.getElementById("q-" + (qs[firstMissing].id as string));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2.5">
        <h1 className="text-[22px] font-extrabold tracking-[-.5px]">Survey</h1>
        <span className={typePillClass(state.rType)}>{typeShort(state.rType)} path</span>
      </div>
      <p className="mb-[22px] text-[13.5px] text-gray-500">
        Questions are tailored to your respondent group. Required questions are marked
        <span className="font-bold text-brand-pink"> *</span>.
      </p>

      <div className="flex flex-col gap-[18px] rounded-2xl border border-line bg-white p-[22px]">
        {qs.map((q, idx) => {
          if (q.kind === "section") {
            return (
              <div key={idx} className="mt-1 border-b border-line2 pb-[7px]">
                <span className="text-[12.5px] font-extrabold tracking-[.2px] text-brand-pink">
                  {q.title}
                </span>
              </div>
            );
          }
          const id = q.id as string;
          const cur = state.survey[id];
          const missing = attempted && required[idx] && !isAnswered(q, cur);
          return (
            <div key={idx} id={"q-" + id}>
              <span className="mb-2.5 block text-[13.5px] font-bold leading-[1.45] text-gray-700">
                {q.label}
                {required[idx] && <span className="text-brand-pink"> *</span>}
              </span>

              {q.kind === "radio" && (
                <div className="flex flex-col gap-2">
                  {(q.opts || []).map((o) => (
                    <RadioOption
                      key={o}
                      label={o}
                      selected={cur === o}
                      onClick={() => actions.setAnswer(id, o)}
                    />
                  ))}
                </div>
              )}

              {q.kind === "multi" && (
                <div className="flex flex-col gap-2">
                  {(q.opts || []).map((o) => {
                    const arr = Array.isArray(cur) ? cur : [];
                    return (
                      <MultiOption
                        key={o}
                        label={o}
                        selected={arr.includes(o)}
                        onClick={() => actions.toggleMulti(id, o)}
                      />
                    );
                  })}
                </div>
              )}

              {q.kind === "select" && (
                <select
                  value={typeof cur === "string" ? cur : ""}
                  onChange={(e) => actions.setAnswer(id, e.target.value)}
                  className="h-[42px] w-full rounded-[9px] border border-[#E2E2E6] bg-white px-2.5 text-[13.5px] outline-none"
                >
                  <option value="">Select…</option>
                  {(q.opts || []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )}

              {q.kind === "number" && (
                <input
                  value={typeof cur === "string" ? cur : ""}
                  onChange={(e) => actions.setAnswer(id, e.target.value)}
                  type="number"
                  placeholder={q.ph || ""}
                  className="h-[42px] w-full rounded-[9px] border border-[#E2E2E6] px-3 text-[13.5px] outline-none"
                />
              )}

              {q.kind === "text" && (
                <textarea
                  value={typeof cur === "string" ? cur : ""}
                  onChange={(e) => actions.setAnswer(id, e.target.value)}
                  placeholder="Type your answer…"
                  className="min-h-[78px] w-full resize-y rounded-[9px] border border-[#E2E2E6] p-3 text-[13.5px] outline-none"
                />
              )}

              {q.kind === "matrix" && (
                <div className="flex flex-col gap-[9px]">
                  {(q.rows || []).map((row) => {
                    const obj = cur && typeof cur === "object" && !Array.isArray(cur) ? cur : {};
                    return (
                      <div key={row} className="flex items-center gap-3">
                        <span className="w-[104px] flex-none text-[12.5px] font-semibold leading-[1.3] text-gray-700 sm:w-[140px]">
                          {row}
                        </span>
                        <select
                          value={(obj as Record<string, string>)[row] || ""}
                          onChange={(e) => actions.setMatrix(id, row, e.target.value)}
                          className="h-10 flex-1 rounded-[9px] border border-[#E2E2E6] bg-white px-2.5 text-[13px] outline-none"
                        >
                          <option value="">Select…</option>
                          {(q.scale || []).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}

              {missing && (
                <span className="mt-1.5 block text-[11.5px] text-red-500">
                  Please answer this question.
                </span>
              )}
            </div>
          );
        })}
      </div>

      {attempted && !complete && (
        <p className="mt-3.5 text-[12.5px] font-semibold text-red-500">
          Please answer all required questions (marked *) before continuing.
        </p>
      )}
      <FlowNav nextLabel="Continue" onNext={handleNext} hideBack={state.surveyOnly} />
    </div>
  );
}
