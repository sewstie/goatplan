import { useId } from "react";
import { COURSE_COLORS } from "@/components/ui/courseColors";
import { cx } from "@/components/ui/cx";
import { deliveryName } from "./scheduleCopy";
import type { UntimedItem } from "./scheduleItems";

export function NoTimeChips({ items }: { items: readonly UntimedItem[] }) {
  const headingId = useId();
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={headingId} className="flex shrink-0 items-center gap-8 border-t border-line py-4 pr-8 pl-8">
      <h3 id={headingId} className="shrink-0 text-8 leading-12 font-650 whitespace-nowrap text-ink-muted">No set time</h3>
      <ul tabIndex={0} aria-labelledby={headingId} className="flex min-w-0 flex-1 gap-4 overflow-x-auto rounded-badge [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <li key={item.sectionId} title={item.title} className={cx("flex shrink-0 items-center gap-5 rounded-pill px-8 py-2 text-8 leading-12 whitespace-nowrap", COURSE_COLORS[item.slot].soft)}>
            <span aria-hidden className={cx("size-8 shrink-0 rounded-swatch", COURSE_COLORS[item.slot].swatch)} />
            <span><b className="font-650">{item.courseCode} {item.sectionCode}</b> · {deliveryName(item.delivery)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
