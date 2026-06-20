import { cx } from "@/lib/cx";

// Initials avatar with a dynamic background color (computed per record), so the
// background stays an inline style while everything else is a Tailwind class.
export function Avatar({
  initials,
  bg,
  size = 32,
  radius = 8,
  fontSize = 12,
  className,
}: {
  initials: string;
  bg: string;
  size?: number;
  radius?: number;
  fontSize?: number;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "flex flex-none items-center justify-center font-bold text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg,
        fontSize,
      }}
    >
      {initials}
    </span>
  );
}
