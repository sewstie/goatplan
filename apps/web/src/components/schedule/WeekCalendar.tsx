"use client";

import type { ReactNode } from "react";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { cx } from "@/components/ui/cx";
import { DAY_NAMES } from "@/lib/data/days";
import type { Day } from "@/lib/data/types";
import { designPixels } from "./blockLayout";
import { CalendarCaption } from "./CalendarCaption";
import { DayHeader } from "./DayHeader";
import { selectionText } from "./dragBlock";
import { DragSelectionBox } from "./DragSelectionBox";
import { SwipeWeekCalendar } from "./SwipeWeekCalendar";
import { TimeAxis } from "./TimeAxis";
import { hourMarks, percentOf, type TimeRange } from "./timeRange";
import { useBlockDrag, type BlockDrag } from "./useBlockDrag";
import { useElementHeight } from "./useElementHeight";
import { usePointerFocus } from "./usePointerFocus";

type WeekCalendarProps = {
  days: readonly Day[];
  range: TimeRange;
  caption: string;
  /** The phone card's line under the grid. Defaults to the caption. */
  note?: string;
  /** What goes in each day column, sized for the current hour height in design px (null until it's measured). */
  renderDay?: (day: Day, pixelsPerHour: number | null) => ReactNode;
  /** Drawn under the day columns, across all of them (the early band). */
  background?: ReactNode;
  /** Drawn over the grid (a message card). */
  overlay?: ReactNode;
  /** Between the grid and the caption (the "No set time" strip). */
  footer?: ReactNode;
  busy?: boolean;
  /** In drawing mode: lets the student draw blocked times, or remove them by starting on one. */
  drag?: BlockDrag;
};

const MIN_HOUR = 36;
/** The grid's own top and bottom padding. */
const GRID_PADDING = 17;

const rootFontPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
const designHeight = (px: number) => `calc(var(--spacing) * ${px})`;

/** The calendar card's content: day names, the time grid and the caption (div.app.md). */
export function WeekCalendar({ days, range, caption, note, renderDay, background, overlay, footer, busy, drag }: WeekCalendarProps) {
  const phone = usePhoneViewport();
  const [viewportRef, viewportHeight] = useElementHeight<HTMLDivElement>();
  const hours = (range.end - range.start) / 60;
  // In design px, like --spacing, so the grid and its blocks grow with the root font.
  const gridHeight = viewportHeight === null ? null : Math.max(designPixels(viewportHeight, rootFontPx()) - GRID_PADDING, hours * MIN_HOUR);
  const pixelsPerHour = gridHeight === null ? null : gridHeight / hours;
  const marks = hourMarks(range);
  const { selection, announcement, surfaceProps } = useBlockDrag(days, range, phone ? undefined : drag);
  const gridFocus = usePointerFocus<HTMLDivElement>();

  if (phone) {
    return (
      <SwipeWeekCalendar days={days} range={range} note={note ?? caption} renderDay={renderDay} background={background} overlay={overlay} footer={footer} busy={busy} drag={drag} />
    );
  }

  const chosen = selection && { first: Math.min(selection.from, selection.to), last: Math.max(selection.from, selection.to) };

  return (
    <div aria-busy={busy} className="flex min-h-0 flex-1 flex-col">
      <DayHeader days={days} />
      <div
        ref={viewportRef}
        role="group"
        aria-label="Calendar time grid"
        tabIndex={0}
        data-pointer-focus={gridFocus.byPointer || undefined}
        {...gridFocus.handlers}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain focus-visible:-outline-offset-2 data-pointer-focus:outline-none"
      >
        <div
          className="flex pt-9 pr-8 pb-8 motion-safe:transition-[height] motion-safe:duration-180"
          style={{ height: gridHeight === null ? "100%" : designHeight(gridHeight + GRID_PADDING), minHeight: designHeight(hours * MIN_HOUR + GRID_PADDING) }}
        >
          <TimeAxis range={range} marks={marks} />
          <div className="relative min-w-0 flex-1">
            {marks.map((minute) => (
              <div
                key={minute}
                aria-hidden
                className="absolute inset-x-0 border-t border-line motion-safe:transition-[top] motion-safe:duration-180"
                style={{ top: `${percentOf(range, minute)}%` }}
              />
            ))}
            {background}
            <div
              {...surfaceProps}
              className={cx(
                "absolute inset-0 grid grid-rows-1",
                drag && "cursor-crosshair select-none [-webkit-touch-callout:none]",
                selection && (selection.erase ? "**:cursor-erase" : "**:cursor-crosshair"),
              )}
              style={{ ...surfaceProps.style, gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
            >
              {days.map((day) => (
                <div key={day} role="group" aria-label={DAY_NAMES[day]} data-drag-day={day} className="relative border-l border-line">
                  {renderDay?.(day, pixelsPerHour)}
                </div>
              ))}
              {selection && chosen && (
                <DragSelectionBox
                  erase={selection.erase}
                  text={selectionText(days.slice(chosen.first, chosen.last + 1), selection.time, selection.erase)}
                  style={{
                    gridColumn: `${chosen.first + 1} / ${chosen.last + 2}`,
                    gridRow: 1,
                    top: `${percentOf(range, selection.time.start)}%`,
                    height: `${percentOf(range, selection.time.end) - percentOf(range, selection.time.start)}%`,
                  }}
                />
              )}
            </div>
            {overlay}
          </div>
        </div>
      </div>
      {drag && <p aria-live="polite" className="sr-only">{announcement}</p>}
      {footer}
      <CalendarCaption left={caption} dayCount={days.length} />
    </div>
  );
}
