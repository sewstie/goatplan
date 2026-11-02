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
  holidays: string | null;
  swaps: string | null;
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
    holidays: noClass.length > 0 ? noClass.map((day) => shortDate(day.date)).join(" · ") : null,
    swaps: swaps.length > 0 ? swaps.map((day) => `${shortDate(day.date)} follows ${DAY_NAMES[day.runs] ?? day.runs}’s schedule`).join(" · ") : null,
    notes,
  };
}
