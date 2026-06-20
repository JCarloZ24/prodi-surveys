import { cx } from "@/lib/cx";

const PILL = (sel: boolean) =>
  cx(
    "flex w-full items-center gap-2.5 rounded-[10px] border px-3.5 py-[11px] text-left text-[13px] font-semibold",
    sel
      ? "border-brand-pink bg-brand-pinkSoft text-[#9D174D]"
      : "border-[#E2E2E6] bg-white text-gray-700",
  );

// Radio-style option (single select).
export function RadioOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={PILL(selected)}>
      <span
        className="h-4 w-4 flex-none rounded-full border-2"
        style={{
          borderColor: selected ? "#E0195F" : "#CBCBD2",
          background: selected ? "#E0195F" : "#fff",
          boxShadow: selected ? "inset 0 0 0 2.5px #fff" : "none",
        }}
      />
      <span className="flex-1">{label}</span>
    </button>
  );
}

// Checkbox-style option (multi select).
export function MultiOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={PILL(selected)}>
      <span
        className="flex h-[17px] w-[17px] flex-none items-center justify-center rounded-[5px] border-2 text-[11px] font-extrabold text-white"
        style={{
          borderColor: selected ? "#E0195F" : "#CBCBD2",
          background: selected ? "#E0195F" : "#fff",
        }}
      >
        {selected ? "✓" : ""}
      </span>
      <span className="flex-1">{label}</span>
    </button>
  );
}
