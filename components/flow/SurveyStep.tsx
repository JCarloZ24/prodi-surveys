"use client";

import { useEffect, useState } from "react";
import { usePortal } from "@/lib/store";
import { typePillClass, typeShort } from "@/lib/format";
import { koboEmbedUrl, KOBO_ENKETO_ORIGIN, isKoboSubmitSuccess } from "@/lib/kobo";

// The survey runs inside an embedded KoboToolbox (Enketo) form — one form per
// respondent path. The respondent fills it out in the iframe; on submit, Enketo
// posts a `submissionsuccess` message to this window, which unlocks "Continue".
export function SurveyStep() {
  const { state, actions } = usePortal();
  const done = state.surveyDone;
  const [reopened, setReopened] = useState(false);

  // The flow only reaches this step client-side, so window is available; building
  // the URL in the initializer passes the real origin (Enketo needs it to post
  // submission events to the parent) without an SSR/hydration mismatch.
  const [src] = useState(() =>
    typeof window === "undefined" ? "" : koboEmbedUrl(state.rType, window.location.origin),
  );

  // Unlock the next step when the embedded form reports a successful submission.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== KOBO_ENKETO_ORIGIN) return;
      if (isKoboSubmitSuccess(e.data)) actions.setSurveyDone(true);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [actions]);

  const showForm = !done || reopened;

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2.5">
        <h1 className="text-[22px] font-extrabold tracking-[-.5px]">Survey</h1>
        <span className={typePillClass(state.rType)}>{typeShort(state.rType)} path</span>
      </div>
      <p className="mb-[22px] text-[13.5px] text-gray-500">
        Complete the survey below. Once you submit it, this page unlocks the next step automatically.
      </p>

      {done && (
        <div className="mb-4 flex items-center gap-2.5 rounded-[11px] border border-green-200 bg-green-50 px-4 py-3 text-[13px] font-semibold text-green-700">
          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-green-500 text-[12px] text-white">
            ✓
          </span>
          Survey received — you can continue to the next step.
        </div>
      )}

      {showForm ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          {src ? (
            <iframe
              key={src}
              src={src}
              title="Survey"
              className="block w-full"
              style={{ height: "min(72vh, 760px)", border: 0 }}
              allow="geolocation; camera; microphone"
            />
          ) : (
            <div className="flex h-[360px] items-center justify-center text-[13px] text-gray-400">
              Loading survey…
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-white p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <span className="text-[20px] text-green-600">✓</span>
          </div>
          <div className="text-[15px] font-bold text-brand-ink">Survey completed</div>
          <p className="mx-auto mt-1.5 max-w-[360px] text-[12.5px] leading-[1.5] text-gray-500">
            Your responses were submitted to KoboToolbox. You can continue, or reopen the survey if you
            need to submit again.
          </p>
          <button
            onClick={() => setReopened(true)}
            className="mt-3 text-[12.5px] font-semibold text-brand-pink underline"
          >
            Open the survey again
          </button>
        </div>
      )}

      {/* Fallback: if auto-detection doesn't fire (network/config), let the
          enumerator confirm completion so a respondent is never trapped. */}
      {!done && (
        <button
          onClick={() => actions.setSurveyDone(true)}
          className="mt-3 block text-[12px] font-medium text-gray-400 underline underline-offset-2"
        >
          Already submitted the survey? Tap to unlock the next step.
        </button>
      )}

      <div className="mt-[18px] flex gap-2.5">
        <button
          onClick={actions.flowBack}
          className="h-[46px] rounded-[11px] border border-[#E2E2E6] bg-white px-[22px] text-sm font-bold text-gray-700"
        >
          Back
        </button>
        <button
          onClick={actions.flowNext}
          disabled={!done}
          className="h-[46px] flex-1 rounded-[11px] bg-brand-ink text-sm font-bold text-white disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
