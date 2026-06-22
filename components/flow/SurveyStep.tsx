"use client";

import { useState } from "react";
import { usePortal } from "@/lib/store";
import { surveyDef } from "@/lib/survey";
import { typePillClass, typeShort } from "@/lib/format";
import type { SurveyQuestion } from "@/lib/types";
import { RadioOption, MultiOption } from "./Options";

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

function sectionName(title: string) {
  return title.split("·")[0]?.trim() || title;
}

export function SurveyStep() {
  const { state, actions } = usePortal();
  const qs = surveyDef(state.rType);

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
  const sections = qs.reduce(
    (acc, q, idx) => {
      if (q.kind === "section") {
        acc.push({ title: q.title || "Survey", items: [] as { question: SurveyQuestion; index: number }[] });
        return acc;
      }
      const last = acc[acc.length - 1] || { title: "Survey", items: [] as { question: SurveyQuestion; index: number }[] };
      if (!acc.length) acc.push(last);
      last.items.push({ question: q, index: idx });
      return acc;
    },
    [] as { title: string; items: { question: SurveyQuestion; index: number }[] }[],
  );
  const sectionComplete = (sectionIndex: number) =>
    sections[sectionIndex]?.items.every(({ question, index }) => {
      if (!required[index]) return true;
      return isAnswered(question, state.survey[question.id as string]);
    }) ?? true;
  const sectionStates = sections.map((_, index) => sectionComplete(index));
  const sectionFilled = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    if (!section) return false;
    if (/optional/i.test(section.title)) {
      return section.items.every(({ question }) =>
        isAnswered(question, state.survey[question.id as string]),
      );
    }
    return sectionStates[sectionIndex];
  };
  const firstIncompleteSection = sectionStates.findIndex((done) => !done);
  const restoredSection = firstIncompleteSection === -1 ? Math.max(0, sections.length - 1) : firstIncompleteSection;
  const [attempted, setAttempted] = useState(false);
  const [activeSection, setActiveSection] = useState(restoredSection);
  const currentSection = Math.min(activeSection, sections.length - 1);
  const current = sections[currentSection];
  const completedSections = sections.map((_, index) => sectionFilled(index));
  const currentComplete = sectionStates[currentSection] ?? true;
  const maxReachableSection = firstIncompleteSection === -1 ? sections.length - 1 : firstIncompleteSection;
  const complete = firstMissing === -1;

  const scrollTop = () => {
    (document.getElementById("flow-scroll") ?? document.documentElement).scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleNext = () => {
    if (currentComplete && currentSection < sections.length - 1) {
      setAttempted(false);
      setActiveSection((value) => value + 1);
      scrollTop();
      return;
    }
    if (complete && currentSection === sections.length - 1) {
      actions.flowNext();
      return;
    }
    setAttempted(true);
    const missing = current.items.find(
      ({ question, index }) => required[index] && !isAnswered(question, state.survey[question.id as string]),
    );
    const el = missing ? document.getElementById("q-" + (missing.question.id as string)) : null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const handleBack = () => {
    if (currentSection > 0) {
      setAttempted(false);
      setActiveSection((value) => value - 1);
      scrollTop();
      return;
    }
    actions.flowBack();
  };
  const chooseSection = (index: number) => {
    if (index > maxReachableSection) return;
    setAttempted(false);
    setActiveSection(index);
    scrollTop();
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

      <div className="mb-5 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2">
          {sections.map((section, index) => {
            const active = index === currentSection;
            const reachable = index <= maxReachableSection;
            const checked = !active && completedSections[index];
            return (
              <button
                key={section.title}
                onClick={() => chooseSection(index)}
                disabled={!reachable}
                className="flex h-10 items-center gap-2 rounded-full border px-3.5 text-[12px] font-bold disabled:cursor-not-allowed disabled:opacity-45"
                style={{
                  borderColor: active ? "#E0195F" : checked ? "#15803D" : "#E2E2E6",
                  background: active ? "#FCE7F0" : "#fff",
                  color: active ? "#9D174D" : checked ? "#15803D" : "#71717A",
                }}
              >
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white"
                  style={{ background: checked ? "#15803D" : active ? "#E0195F" : "#D4D4D8" }}
                >
                  {completedSections[index] ? "✓" : index + 1}
                </span>
                {sectionName(section.title)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-[22px]">
        <div className="mb-5 border-b border-line2 pb-3">
          <span className="text-[12.5px] font-extrabold tracking-[.2px] text-brand-pink">
            {current.title}
          </span>
          <div className="mt-1 text-[12px] font-semibold text-gray-400">
            Section {currentSection + 1} of {sections.length}
          </div>
        </div>

        <div className="flex flex-col gap-[22px]">
        {current.items.map(({ question: q, index: idx }) => {
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
      </div>

      {attempted && !currentComplete && (
        <p className="mt-3.5 text-[12.5px] font-semibold text-red-500">
          Please answer all required questions in this section before continuing.
        </p>
      )}
      <div className="mt-[18px] flex gap-2.5">
        {(!state.surveyOnly || currentSection > 0) && (
          <button
            onClick={handleBack}
            className="h-[46px] rounded-[11px] border border-[#E2E2E6] bg-white px-[22px] text-sm font-bold text-gray-700"
          >
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          className="h-[46px] flex-1 rounded-[11px] bg-brand-ink text-sm font-bold text-white"
        >
          {currentSection === sections.length - 1 ? "Continue" : "Next section"}
        </button>
      </div>
    </div>
  );
}
