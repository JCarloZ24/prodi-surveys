"use client";

import { usePortal } from "@/lib/store";

// Back + Continue button row shared across most flow steps.
export function FlowNav({
  nextLabel = "Continue",
  onNext,
  disabled = false,
  hideBack = false,
}: {
  nextLabel?: string;
  onNext?: () => void;
  disabled?: boolean;
  hideBack?: boolean;
}) {
  const { actions } = usePortal();
  return (
    <div className="mt-[18px] flex gap-2.5">
      {!hideBack && (
        <button
          onClick={actions.flowBack}
          className="h-[46px] rounded-[11px] border border-[#E2E2E6] bg-white px-[22px] text-sm font-bold text-gray-700"
        >
          Back
        </button>
      )}
      <button
        onClick={onNext || actions.flowNext}
        disabled={disabled}
        className="h-[46px] flex-1 rounded-[11px] text-sm font-bold text-white"
        style={{
          background: disabled ? "#D4D4D8" : "#18181B",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {nextLabel}
      </button>
    </div>
  );
}
