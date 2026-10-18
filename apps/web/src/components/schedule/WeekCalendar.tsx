"use client";

import type { ReactNode } from "react";
import { DAY_NAMES } from "@/lib/data/days";
import type { Day } from "@/lib/data/types";
import { CalendarCaption } from "./CalendarCaption";
import { DayHeader } from "./DayHeader";
import { blockDensity, type Density } from "./density";
import { TimeAxis } from "./TimeAxis";
import { hourMarks, percentOf, type TimeRange } from "./timeRange";
import { useElementHeight } from "./useElementHeight";

type WeekCalendarProps = {
  days: readonly Day[];
  range: TimeRange;
  caption: string;
  /** What goes in each day column, sized for the current hour height. */
  renderDay?: (day: Day, density: Density) => ReactNode;
  /** Drawn under the day columns, across all of them (the early band). */
  background?: ReactNode;
  /** Drawn over the grid (a message card). */
  overlay?: ReactNode;
  /** Between the grid and the caption (the "No set time" strip). */
  footer?: ReactNode;
};

/** The calendar card's content: day names, the time grid and the caption (div.app.md). */
export function WeekCalendar({ days, range, caption, renderDay, background, overlay, footer }: WeekCalendarProps) {
  const [gridRef, gridHeight] = useElementHeight<HTMLDivElement>();
  const hours = (range.end - range.start) / 60;
  const density = blockDensity(gridHeight === null ? null : gridHeight / hours);
  const marks = hourMarks(range);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DayHeader days={days} />
      <div className="flex min-h-0 flex-1 pt-9 pr-8 pb-8">
        <TimeAxis range={range} marks={marks} />
        <div ref={gridRef} className="relative min-w-0 flex-1">
          {marks.map((minute) => (
            <div
              key={minute}
              aria-hidden
              className="absolute inset-x-0 border-t border-line"
              style={{ top: `${percentOf(range, minute)}%` }}
            />
          ))}
          {background}
          <div
            className="absolute inset-0 grid"
            style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
          >
            {days.map((day) => (
              <div key={day} role="group" aria-label={DAY_NAMES[day]} className="relative border-l border-line">
                {renderDay?.(day, density)}
              </div>
            ))}
          </div>
          {overlay}
        </div>
      </div>
      {footer}
      <CalendarCaption left={caption} dayCount={days.length} />
    </div>
  );
}
