import type { Day, TermFile } from "@/lib/data/types";
import type { Schedule } from "@/lib/engine/types";
import { fitRange, type TimeRange } from "./timeRange";
import { visibleDays } from "./weekDays";

type CalendarItem = TimeRange & { day: Day };

export function calendarBounds(
  term: TermFile | null,
  schedules: readonly Schedule[],
  blocked: readonly CalendarItem[],
  previews: readonly CalendarItem[] = [],
) {
  const sectionIds = new Set(schedules.flatMap((schedule) =>
    schedule.courses.flatMap((course) => [...course.sections, ...course.alternatives.flat()]),
  ));
  const meetings = (term?.courses ?? []).flatMap((course) =>
    course.sections.filter((section) => sectionIds.has(section.id)).flatMap((section) =>
      section.meetings.flatMap((meeting) => meeting.days.map((day) => ({ ...meeting, day }))),
    ),
  );
  const items = [...meetings, ...blocked, ...previews];
  return { range: fitRange(items), days: visibleDays(items) };
}
