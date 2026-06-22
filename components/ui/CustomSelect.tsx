"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/cx";

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  /** Compact height — use inside matrix rows */
  compact?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  className,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const triggerH = compact ? "h-10" : "h-[42px]";
  const textSz = compact ? "text-[13px]" : "text-[13.5px]";

  return (
    <div ref={ref} className={cx("relative w-full", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "flex w-full items-center justify-between rounded-[9px] border bg-white px-3 transition-colors",
          triggerH,
          textSz,
          open
            ? "border-[#E0195F] ring-2 ring-[#E0195F]/15"
            : "border-[#E2E2E6] hover:border-[#C4C4CC]",
          value ? "text-[#18181B]" : "text-gray-400",
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cx("ml-2 flex-none text-gray-400 transition-transform duration-150", open && "rotate-180")}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-[11px] border border-[#E2E2E6] bg-white shadow-lg"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,.10)" }}
        >
          <ul className="max-h-[220px] overflow-y-auto py-1">
            {options.map((opt) => {
              const selected = opt === value;
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={cx(
                      "flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[13.5px] transition-colors",
                      selected
                        ? "bg-[#FFF1F5] font-semibold text-[#E0195F]"
                        : "text-[#18181B] hover:bg-[#F7F7F8]",
                    )}
                  >
                    <span>{opt}</span>
                    {selected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E0195F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
