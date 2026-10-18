import { DAY_NAMES } from "@/lib/data/days";
import type { Day } from "@/lib/data/types";

/** Full day names for the work week, short ones when all seven days are shown (div.app-17.md). */
export function DayHeader({ days }: { days: readonly Day[] }) {
  return (
    <div
      aria-hidden
      className="mt-3 grid h-(--size-day-header) shrink-0 pr-8"
      style={{ gridTemplateColumns: `var(--size-time-axis) repeat(${days.length}, minmax(0, 1fr))` }}
    >
      <span />
      {days.map((day) => (
        <span
          key={day}
          className="flex min-w-0 items-center justify-center truncate border-l border-line text-10 leading-14-5 font-620"
        >
          {days.length > 5 ? day : DAY_NAMES[day]}
        </span>
      ))}
    </div>
  );
}
