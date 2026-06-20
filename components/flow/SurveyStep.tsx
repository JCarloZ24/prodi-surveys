"use client";

import { usePortal } from "@/lib/store";
import { surveyDef } from "@/lib/survey";
import { typePillClass, typeShort } from "@/lib/format";
import { RadioOption, MultiOption } from "./Options";
import { FlowNav } from "./FlowNav";

export function SurveyStep() {
  const { state, actions } = usePortal();
  const qs = surveyDef(state.rType);

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2.5">
        <h1 className="text-[22px] font-extrabold tracking-[-.5px]">Survey</h1>
        <span className={typePillClass(state.rType)}>{typeShort(state.rType)} path</span>
      </div>
      <p className="mb-[22px] text-[13.5px] text-gray-500">
        Questions are tailored to your respondent group.
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
          return (
            <div key={idx}>
              <span className="mb-2.5 block text-[13.5px] font-bold leading-[1.45] text-gray-700">
                {q.label}
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
                        <span className="w-[140px] flex-none text-[12.5px] font-semibold text-gray-700">
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
            </div>
          );
        })}
      </div>

      <FlowNav nextLabel="Continue to verification" />
    </div>
  );
}
