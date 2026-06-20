import { cx } from "@/lib/cx";

// A rounded track with a filled bar. `pct` drives the width (inline, since it is
// computed); the fill is either the brand gradient or a solid color.
export function ProgressBar({
  pct,
  color,
  gradient,
  trackClass = "bg-line",
  height = 7,
}: {
  pct: number;
  color?: string;
  gradient?: boolean;
  trackClass?: string;
  height?: number;
}) {
  return (
    <div
      className={cx("overflow-hidden rounded-md", trackClass)}
      style={{ height }}
    >
      <div
        className="h-full rounded-md"
        style={{
          width: Math.min(100, pct) + "%",
          background: gradient
            ? "linear-gradient(90deg,#F0246A,#FB923C)"
            : color || "#E0195F",
        }}
      />
    </div>
  );
}
