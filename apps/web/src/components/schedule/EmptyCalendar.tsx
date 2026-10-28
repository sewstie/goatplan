import { BookOpen } from "@phosphor-icons/react/ssr";
import { WEEK } from "@/lib/data/days";
import { CalendarMessage } from "./CalendarMessage";
import { DEFAULT_RANGE } from "./timeRange";
import { WeekCalendar } from "./WeekCalendar";

/** No courses yet (div.app.md). */
export function EmptyCalendar() {
  return (
    <WeekCalendar
      days={WEEK.slice(0, 5)}
      range={DEFAULT_RANGE}
      caption="No timed courses yet"
      note="Auto-fit to your schedule"
      overlay={
        <div data-guide-hide>
        <CalendarMessage icon={<BookOpen className="text-accent" />} title="Add your first course">
          <p>
            Search by course code or professor <span className="tablet:hidden">above</span>
            <span className="hidden tablet:inline">in the sidebar</span>.
          </p>
          <p className="font-600 text-ink">Try CS 2102</p>
        </CalendarMessage>
        </div>
      }
    />
  );
}
