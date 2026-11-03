import type { Day } from "@/lib/data";
import type { DateRange } from "@/lib/data/types";
import type { SavedCourse } from "@/lib/plans/types";
import file from "./term-calendar-data.json";

export type TermCalendar = {
  noClass: { date: string; name: string }[];
  swaps: { date: string; runs: Day }[];
  notes: { date: string; text: string }[];
};

const terms = file.terms as Record<string, TermCalendar>;

export const MISSING_CALENDAR_NOTE = "Holidays aren't removed. Check WPI's calendar.";

export function termCalendar(termId: string): TermCalendar | null {
  if (!terms[termId]) return null;
  const all = Object.values(terms);
  return { noClass: all.flatMap((term) => term.noClass), swaps: all.flatMap((term) => term.swaps), notes: all.flatMap((term) => term.notes) };
}

export function exportNotes(calendar: TermCalendar | null, schedule: readonly SavedCourse[], term: DateRange): string[] {
  if (!calendar) return [MISSING_CALENDAR_NOTE];
  const ranges = schedule.flatMap((course) => course.sections.filter((section) => section.meetings.length > 0).map((section) => section.dates ?? term));
  return calendar.notes.filter((note) => ranges.some((range) => range.start <= note.date && note.date <= range.end)).map((note) => note.text);
}
