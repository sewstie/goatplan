"use client";

import { createPortal } from "react-dom";
import { formatTimeRange } from "@/lib/data/time";
import type { ClassItem } from "./scheduleItems";
import type { TooltipPosition } from "./tooltipPosition";

/**
 * Details of the hovered or focused block (div.app-19.md). It renders into document.body so the calendar
 * card, which clips its content, can't cut it off. The block's label already says all of this, so screen
 * readers skip it.
 */
export function BlockTooltip({ item, position }: { item: ClassItem; position: TooltipPosition }) {
  const place = [item.location, ...item.instructors].filter(Boolean).join(" · ");
  return createPortal(
    <div
      aria-hidden
      data-calendar-tooltip
      className="pointer-events-none fixed z-30 flex w-220 flex-col gap-2.8 rounded-card border border-line-popover bg-surface px-14 py-12 text-ink shadow-popover"
      style={position}
    >
      <p className="text-11 leading-15-95 font-700">
        {item.courseCode} · {item.sectionCode}
      </p>
      <p className="mt-3 mb-5 text-10 leading-15">{item.title}</p>
      <p className="text-9 leading-15-3 text-ink-muted">
        {item.day} · {formatTimeRange(item.start, item.end, "shared")}
      </p>
      {place && <p className="text-9 leading-15-3 text-ink-muted">{place}</p>}
    </div>,
    document.body,
  );
}
