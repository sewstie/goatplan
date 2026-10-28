import type { Day } from "@/lib/data/types";
import { blockPosition } from "./blockStyles";
import { DEFAULT_RANGE } from "./timeRange";

// Made-up class times for the phone, shaped like a real week. They don't come from data.
const PLACEHOLDERS: Readonly<Partial<Record<Day, readonly [number, number][]>>> = {
  Mon: [
    [540, 590],
    [660, 710],
    [840, 890],
  ],
  Tue: [
    [600, 650],
    [780, 890],
  ],
  Wed: [
    [540, 590],
    [660, 710],
  ],
  Thu: [
    [600, 650],
    [780, 890],
  ],
  Fri: [
    [540, 590],
    [840, 890],
  ],
};

/** Gray stand-ins for phone class blocks while the term loads, with bars where the text goes. */
export function PhoneLoadingBlocks({ day }: { day: Day }) {
  return (PLACEHOLDERS[day] ?? []).map(([start, end]) => (
    <span
      key={start}
      data-guide-hide
      aria-hidden
      className="absolute flex flex-col gap-5 overflow-hidden rounded-block bg-skeleton-block px-7 py-8 motion-safe:animate-pulse"
      style={{
        ...blockPosition(DEFAULT_RANGE, { start, end }, { lane: 0, lanes: 1 }),
        animationDelay: `${(start - DEFAULT_RANGE.start) * 4}ms`,
      }}
    >
      <span className="h-9 w-3/5 shrink-0 rounded-swatch bg-surface-subtle" />
      <span className="h-7 w-4/5 shrink-0 rounded-swatch bg-surface-subtle" />
      <span className="h-7 w-2/5 shrink-0 rounded-swatch bg-surface-subtle" />
    </span>
  ));
}
