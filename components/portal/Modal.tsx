"use client";

import { useEffect } from "react";

// Centered overlay modal. Closes on backdrop click, Escape, or the ✕ button.
export function Modal({
  open,
  onClose,
  title,
  children,
  widthClass = "max-w-[480px]",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  widthClass?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative z-10 w-full ${widthClass} max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl`}
      >
        <div className="flex items-center justify-between border-b border-[#F2F2F4] px-5 py-4">
          <h2 className="text-[16px] font-extrabold tracking-[-0.3px] text-[#18181B]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex-none rounded-md p-1 text-gray-400 hover:bg-[#F4F4F5] hover:text-gray-600"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
