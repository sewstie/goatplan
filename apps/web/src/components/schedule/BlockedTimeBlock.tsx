import type { CSSProperties } from "react";
import { formatTimeRange } from "@/lib/data/time";
import { cx } from "@/components/ui/cx";
import type { Density } from "./density";

type BlockedTimeBlockProps = {
  start: number;
  end: number;
  /** The name the student gave it, like "Work". */
  label?: string;
  density: Density;
  style: CSSProperties;
};

/**
 * A time the student blocked, hatched like the early band (div.app-3.md): its name and time, or just
 * its time written short ("2 PM–4 PM") so it fits a narrow column, then "blocked".
 */
export function BlockedTimeBlock({ start, end, label, density, style }: BlockedTimeBlockProps) {
  const dense = density === "dense";
  const time = formatTimeRange(start, end);
  const small = cx("truncate", dense ? "text-7 leading-10-5" : "text-8 leading-12");
  return (
    <div
      className={cx(
        "absolute overflow-hidden rounded-block border border-line-disabled bg-hatch text-ink-hatch",
        dense ? "px-4 pt-9.5" : "px-7 pt-12.5",
      )}
      style={style}
    >
      <p className="truncate text-9 leading-13 font-600">{label ?? formatTimeRange(start, end, "short")}</p>
      {label && <p className={cx(small, "mt-4")}>{time}</p>}
      <p className={small}>blocked</p>
    </div>
  );
}
