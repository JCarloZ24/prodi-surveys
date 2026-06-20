"use client";

import { usePortal } from "@/lib/store";
import { initials, typePillClass, typeShort } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { cx } from "@/lib/cx";
import type { Respondent } from "@/lib/types";

function CheckChip({ label, done }: { label: string; done: boolean }) {
  return (
    <span
      className={cx(
        "rounded-[7px] px-2.5 py-[5px] text-[11.5px] font-bold",
        done ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700",
      )}
    >
      {done ? "✓" : "✗"} {label}
    </span>
  );
}

export function QaReview() {
  const { state, actions } = usePortal();
  const queue = state.respondents.filter(
    (r) => r.status === "Pending QA" || r.status === "Needs Follow-up",
  );

  return (
    <div className="max-w-[1080px]">
      <h1 className="mb-1 text-2xl font-extrabold tracking-[-.5px]">QA Review queue</h1>
      <p className="mb-5 text-[13.5px] text-gray-500">
        {queue.length} submissions awaiting decision. Flagged items are highlighted.
      </p>

      <div className="flex flex-col gap-3">
        {queue.map((q: Respondent) => {
          const hasFlags = q.flags.length > 0;
          return (
            <div
              key={q.id}
              className="rounded-[13px] border bg-white p-4 px-[18px]"
              style={{
                borderColor: hasFlags ? "#FECACA" : "#E7E7EA",
                borderLeft: `4px solid ${hasFlags ? "#DC2626" : "#E0195F"}`,
              }}
            >
              <div className="mb-3.5 flex items-center gap-[13px]">
                <Avatar initials={initials(q.name).toUpperCase()} bg={q.color} size={40} radius={10} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-[9px]">
                    <span className="text-[14.5px] font-bold">{q.name}</span>
                    <span className={typePillClass(q.type)}>{typeShort(q.type)}</span>
                  </div>
                  <div className="text-[12px] text-gray-400">
                    {q.org} · {q.region} · {q.mode}
                  </div>
                </div>
                <button
                  onClick={() => actions.openProfile(q.id)}
                  className="rounded-lg bg-gray-100 px-3 py-2 text-[12.5px] font-bold text-gray-700"
                >
                  View profile
                </button>
              </div>

              <div className="mb-3.5 flex flex-wrap gap-2">
                <CheckChip label="Email" done={q.emailV} />
                <CheckChip label="Survey" done={q.surveyDone} />
                <CheckChip label="Selfie" done={q.selfie} />
                <CheckChip label="Unique" done={!hasFlags} />
              </div>

              {hasFlags && (
                <div className="mb-3.5 flex flex-wrap gap-2 rounded-[9px] border border-red-200 bg-red-50 px-3 py-2.5">
                  <span className="self-center text-[11.5px] font-bold text-red-700">⚠ FLAGS</span>
                  {q.flags.map((f) => (
                    <span
                      key={f}
                      className="rounded-md border border-red-200 bg-white px-2 py-[3px] text-[11.5px] font-semibold text-red-800"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-[9px]">
                <button
                  onClick={() => actions.qaAct(q.id, "approve")}
                  className="flex h-[38px] flex-1 items-center justify-center gap-[7px] rounded-[9px] bg-green-700 text-[13px] font-bold text-white"
                >
                  ✓ Approve · Verify
                </button>
                <button
                  onClick={() => actions.qaAct(q.id, "follow")}
                  className="flex h-[38px] flex-1 items-center justify-center gap-[7px] rounded-[9px] border border-orange-200 bg-orange-50 text-[13px] font-bold text-orange-800"
                >
                  ⏳ Needs follow-up
                </button>
                <button
                  onClick={() => actions.qaAct(q.id, "reject")}
                  className="flex h-[38px] flex-1 items-center justify-center gap-[7px] rounded-[9px] border border-red-200 bg-red-50 text-[13px] font-bold text-red-700"
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          );
        })}

        {queue.length === 0 && (
          <div className="rounded-[13px] border border-line bg-white p-14 text-center">
            <div className="text-[15px] font-bold text-green-700">Queue clear 🎉</div>
            <div className="mt-[5px] text-[13px] text-gray-400">
              No submissions pending review right now.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
