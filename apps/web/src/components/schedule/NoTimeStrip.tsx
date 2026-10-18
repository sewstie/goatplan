import { useId } from "react";
import { Badge } from "@/components/ui/Badge";
import { COURSE_COLORS } from "@/components/ui/courseColors";
import { cx } from "@/components/ui/cx";
import { deliveryName } from "./scheduleCopy";
import type { UntimedItem } from "./scheduleItems";

/** Sections with no meeting time, under the grid instead of in it (div.app-13.md). */
export function NoTimeStrip({ items }: { items: readonly UntimedItem[] }) {
  const headingId = useId();
  if (items.length === 0) return null;
  return (
    <section
      aria-labelledby={headingId}
      className="flex shrink-0 flex-col gap-9 border-t border-line pt-13.5 pr-13 pb-9 pl-(--size-time-axis)"
    >
      <h3 id={headingId} className="text-10 leading-14-5 font-700">
        No set time
      </h3>
      {/* Capped so many untimed sections can't squeeze the grid; the rest scroll. */}
      <ul className="flex max-h-120 flex-col gap-6 overflow-y-auto">

        {items.map((item) => (
          <li
            key={item.sectionId}
            className={cx("flex items-center gap-8 rounded-row px-10 py-9", COURSE_COLORS[item.slot].soft)}
          >
            <span aria-hidden className={cx("size-8 shrink-0 rounded-swatch", COURSE_COLORS[item.slot].swatch)} />
            <span className="flex min-w-0 flex-1 flex-col gap-2.5">
              <span className="truncate text-10 leading-14-5 font-700">
                {item.courseCode} · {item.sectionCode}
              </span>
              <span className="truncate text-9 leading-13 text-ink-muted">
                {item.title} · {deliveryName(item.delivery)}
              </span>
            </span>
            <Badge tone="neutral" size="sm">
              No set time
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
