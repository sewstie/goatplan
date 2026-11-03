import { formatDays, formatTimeRange } from "@/lib/data";
import type { DateRange } from "@/lib/data/types";
import type { SavedCourse } from "@/lib/plans/types";
import type { TermCalendar } from "./term-calendar";

export interface ExportSection {
  id: string;
  name: string;
  times: string;
  dates: string;
}

export interface ExportSummary {
  termDates: string;
  sections: ExportSection[];
  untimed: string[];
  /** "Feb 25 · Academic Advising Day", one per day. */
  holidays: string[];
  /** "Jan 13 follows Monday’s schedule", one per day. */
  swaps: string[];
  notes: string[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday" };

function shortDate(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}`;
}

const span = ({ start, end }: DateRange) => `${shortDate(start)}–${shortDate(end)}`;

const sectionCode = (course: string, id: string) => (id.startsWith(`${course}-`) ? id.slice(course.length + 1) : id);

const inRange = (date: string, { start, end }: DateRange) => start <= date && date <= end;

/** "4 classes · Jan 13–Mar 5, 2027 · 1 left out", the line at the top of Export. */
export function exportLine(summary: ExportSummary): string {
  const count = summary.sections.length;
  const parts = [`${count} ${count === 1 ? "class" : "classes"}`, summary.termDates];
  if (summary.untimed.length > 0) parts.push(`${summary.untimed.length} left out`);
  return parts.join(" · ");
}

/** What the calendar file will hold, in the words the export screen uses. */
export function exportSummary(schedule: readonly SavedCourse[], term: DateRange, calendar: TermCalendar | null): ExportSummary {
  const sections: ExportSection[] = [];
  const untimed: string[] = [];
  for (const course of schedule) {
    for (const section of course.sections) {
      const name = `${course.code} · ${sectionCode(course.code, section.id)}`;
      if (section.meetings.length === 0) {
        untimed.push(name);
        continue;
      }
      const times = section.meetings.map((meeting) => `${formatDays(meeting.days)} · ${formatTimeRange(meeting.start, meeting.end)}`).join(", ");
      sections.push({ id: section.id, name, times, dates: span(section.dates ?? term) });
    }
  }
  const noClass = calendar?.noClass.filter((day) => inRange(day.date, term)) ?? [];
  const swaps = calendar?.swaps.filter((day) => inRange(day.date, term)) ?? [];
  const notes = calendar?.notes.filter((note) => inRange(note.date, term)).map((note) => note.text) ?? [];
  return {
    termDates: `${span(term)}, ${term.end.slice(0, 4)}`,
    sections,
    untimed,
    holidays: noClass.map((day) => `${shortDate(day.date)} · ${day.name}`),
    swaps: swaps.map((day) => `${shortDate(day.date)} follows ${DAY_NAMES[day.runs] ?? day.runs}’s schedule`),
    notes,
  };
}
