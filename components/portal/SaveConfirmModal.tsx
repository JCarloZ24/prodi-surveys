"use client";

import { usePortal } from "@/lib/store";

export function SaveConfirmModal() {
  const { actions } = usePortal();
  return (
    <div
      onClick={actions.cancelSaveSettings}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-pop w-[440px] max-w-full rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,.28)]"
      >
        <div className="mb-4 flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-orange-50">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
        </div>
        <h3 className="mb-2 text-[18px] font-extrabold tracking-[-.4px]">
          Update targets &amp; incentives?
        </h3>
        <p className="mb-[18px] text-[13.5px] leading-[1.6] text-gray-500">
          These numbers drive progress reporting and all payout calculations across the portal.
          Verified payouts already recorded are not changed, but pending amounts will recalculate.
          This action is logged in the audit trail.
        </p>
        <div className="flex justify-end gap-2.5">
          <button
            onClick={actions.cancelSaveSettings}
            className="h-[42px] rounded-[10px] border border-[#E2E2E6] bg-white px-[18px] text-[13.5px] font-bold text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={actions.confirmSaveSettings}
            className="h-[42px] rounded-[10px] bg-green-700 px-[22px] text-[13.5px] font-bold text-white"
          >
            Yes, save changes
          </button>
        </div>
      </div>
    </div>
  );
}
