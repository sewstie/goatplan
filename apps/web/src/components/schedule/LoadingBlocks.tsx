import type { Day } from "@/lib/data/types";
import { DEFAULT_RANGE, percentOf } from "./timeRange";

// Placeholder blocks while the term loads (div.app-1.md). They don't come from data.
const PLACEHOLDERS: Readonly<Record<"odd" | "even", readonly [number, number][]>> = {
  odd: [
    [540, 590],
    [660, 710],
  ],
  even: [
    [600, 650],
    [840, 950],
  ],
};

export function LoadingBlocks({ day }: { day: Day }) {
  const blocks = day === "Tue" || day === "Thu" ? PLACEHOLDERS.even : PLACEHOLDERS.odd;
  return blocks.map(([start, end]) => {
    const top = percentOf(DEFAULT_RANGE, start);
    return (
      <span
        key={start}
        data-guide-hide
        aria-hidden
        className="absolute inset-x-4 rounded-loading bg-skeleton-block"
        style={{ top: `${top}%`, height: `${percentOf(DEFAULT_RANGE, end) - top}%` }}
      />
    );
  });
}
