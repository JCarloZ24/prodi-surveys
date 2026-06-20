"use client";

import { usePortal } from "@/lib/store";

export function Toast() {
  const { state } = usePortal();
  if (!state.toast) return null;
  return (
    <div className="animate-pop fixed bottom-6 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-brand-ink px-5 py-3 text-[13.5px] font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,.25)]">
      <span className="text-green-400">✓</span>
      {state.toast}
    </div>
  );
}
