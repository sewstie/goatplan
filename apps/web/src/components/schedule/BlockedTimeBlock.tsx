import type { CSSProperties } from "react";
import { formatTimeRange } from "@/lib/data/time";
import { cx } from "@/components/ui/cx";
import type { Density } from "./density";

type BlockedTimeBlockProps = {
  start: number;
  end: number;
  density: Density;
  style: CSSProperties;
};

/** A time the student blocked, hatched like the early band (div.app-3.md). */
export function BlockedTimeBlock({ start, end, density, style }: BlockedTimeBlockProps) {
  const dense = density === "dense";
  return (
    <div
      className={cx(
        "absolute overflow-hidden rounded-block border border-line-disabled bg-hatch text-ink-hatch",
        dense ? "px-4 pt-9.5" : "px-7 pt-12.5",
      )}
      style={style}
    >
      <p className="truncate text-9 leading-13 font-600">Blocked time</p>
      <p className={cx("truncate", dense ? "text-7 leading-10-5" : "text-8 leading-12")}>
        {formatTimeRange(start, end)}
      </p>
    </div>
  );
}
