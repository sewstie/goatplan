"use client";

import { useRef, useState, type ReactNode } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/ssr";
import { SortSelect } from "@/components/preferences/SortSelect";
import { cx } from "@/components/ui/cx";
import { DAY_NAMES } from "@/lib/data/days";
import { formatTimeRange, formatTimeShort } from "@/lib/data/time";
import type { Day } from "@/lib/data/types";
import type { Density } from "./density";
import { selectionText } from "./dragBlock";
import { DragSelectionBox } from "./DragSelectionBox";
import { hourMarks, percentOf, type TimeRange } from "./timeRange";
import { useBlockDrag, type BlockDrag } from "./useBlockDrag";
import { useKeptScrollLeft } from "./useKeptScrollLeft";

type SwipeWeekCalendarProps = {
  days: readonly Day[];
  range: TimeRange;
  /** The line under the grid, like "Auto-fit to your schedule". */
  note: string;
  renderDay?: (day: Day, density: Density) => ReactNode;
  background?: ReactNode;
  overlay?: ReactNode;
  footer?: ReactNode;
  busy?: boolean;
  drag?: BlockDrag;
};

/** "8:30", "9", "10" — the phone axis drops AM and PM to stay narrow. */
function axisLabel(minute: number): string {
  return formatTimeShort(minute).replace(/ [AP]M$/, "");
}

/**
 * The phone calendar card: two days side by side at a fixed hour height, swiped sideways for the rest
 * of the week. The time labels stay put while the days scroll. The page scrolls down, not the card.
 */
export function SwipeWeekCalendar({ days, range, note, renderDay, background, overlay, footer, busy, drag }: SwipeWeekCalendarProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(false);
  useKeptScrollLeft(scroller);
  const hours = (range.end - range.start) / 60;
  const height = `calc(var(--size-phone-hour) * ${hours})`;
  const marks = hourMarks(range);
  const empty = !renderDay && !busy;
  const { selection, announcement, surfaceProps } = useBlockDrag(days, range, drag);
  const first = selection ? Math.min(selection.from, selection.to) : -1;
  const last = selection ? Math.max(selection.from, selection.to) : -1;

  function swipe() {
    const element = scroller.current;
    if (!element) return;
    element.scrollTo({ left: atEnd ? 0 : element.scrollLeft + element.clientWidth * 0.88, behavior: "smooth" });
  }

  return (
    <div aria-busy={busy} className="flex flex-col">
      <div className="flex items-start justify-between gap-12 px-12 pt-12 pb-8">
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="text-10 font-700">Your week</h2>
          <p className="text-8 leading-11-6 text-ink-muted">
            {formatTimeRange(range.start, range.end, "short")}
            {empty && " · No set times yet"}
          </p>
        </div>
        <div className="-mt-10 flex shrink-0 flex-col items-end">
          <SortSelect variant="link" className="min-h-44 max-w-160" />
          {days.length > 2 && (
            <button
              type="button"
              onClick={swipe}
              className="inline-flex min-h-24 cursor-pointer items-center gap-3 rounded-badge text-8 leading-11-6 font-570 text-accent"
            >
              {atEnd ? <><CaretLeft aria-hidden className="size-9" />Back to {DAY_NAMES[days[0]]}</> : <>Swipe for more days<CaretRight aria-hidden className="size-9" /></>}
            </button>
          )}
        </div>
      </div>
      <div className="relative">
        <div
          ref={scroller}
          role="group"
          aria-label="Calendar time grid"
          tabIndex={0}
          onScroll={(event) => {
            const element = event.currentTarget;
            setAtEnd(element.scrollLeft + element.clientWidth >= element.scrollWidth - 4);
          }}
          className="@container scroll-pl-(--size-phone-axis) snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div
            {...surfaceProps}
            className={cx(
              "relative flex w-max pr-8 pb-10",
              drag && "select-none [-webkit-touch-callout:none]",
              selection && (selection.erase ? "**:cursor-not-allowed" : "**:cursor-crosshair"),
            )}
          >
            <div aria-hidden className="absolute top-(--size-phone-day-header) right-0 left-(--size-phone-axis)" style={{ height }}>
              {marks.map((minute) => (
                <div key={minute} className="absolute inset-x-0 border-t border-line" style={{ top: `${percentOf(range, minute)}%` }} />
              ))}
              {background}
            </div>
            <div aria-hidden className="sticky left-0 z-2 w-(--size-phone-axis) shrink-0 bg-surface pt-(--size-phone-day-header)">
              <div className="relative" style={{ height }}>
                {marks.map((minute) => (
                  <span
                    key={minute}
                    className="absolute right-8 -translate-y-1/2 text-8 leading-11-6 whitespace-nowrap text-ink-muted"
                    style={{ top: `${percentOf(range, minute)}%` }}
                  >
                    {axisLabel(minute)}
                  </span>
                ))}
              </div>
            </div>
            {days.map((day, index) => (
              <div key={day} className="w-[44cqw] shrink-0 snap-start border-l border-line">
                <p aria-hidden className="flex h-(--size-phone-day-header) items-center justify-center text-10 font-650">
                  {day}
                </p>
                <div
                  role="group"
                  aria-label={DAY_NAMES[day]}
                  data-drag-day={day}
                  className={cx("relative", drag && "cursor-crosshair")}
                  style={{ height }}
                >
                  {renderDay?.(day, "regular")}
                  {selection && index >= first && index <= last && (
                    <DragSelectionBox
                      erase={selection.erase}
                      text={index === first ? selectionText(days.slice(first, last + 1), selection.time, selection.erase) : undefined}
                      style={{
                        top: `${percentOf(range, selection.time.start)}%`,
                        height: `${percentOf(range, selection.time.end) - percentOf(range, selection.time.start)}%`,
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {overlay}
      </div>
      {drag && <p aria-live="polite" className="sr-only">{announcement}</p>}
      {footer}
      <div className="flex justify-between gap-12 px-12 pt-6 pb-12 text-8 leading-11-6 text-ink-muted">
        <p>{note}</p>
        <p>{days.length > 5 ? `${days.length} days` : "Mon–Fri"}</p>
      </div>
    </div>
  );
}
