import type { Day, Section } from "./types";
import { lecturesByProfessor } from "./instructors";

// The engine compares times in 5-minute slots, so these checks do too.
const SLOT = 5;

/** A stretch of one day that a section takes, in 5-minute slots. */
export interface Span {
  day: Day;
  first: number;
  pastLast: number;
}

/** The rules the engine filters options by: start time, blocked times and open sections. */
export interface FitRules {
  startsAfter: number;
  blocked: readonly { day: Day; start: number; end: number }[];
  onlyOpen: boolean;
  professor?: string | null;
}

function span(day: Day, start: number, end: number): Span {
  return { day, first: Math.floor(start / SLOT), pastLast: Math.ceil(end / SLOT) };
}

export function meetingSpans(sections: readonly Section[]): Span[] {
  return sections.flatMap((section) =>
    section.meetings.flatMap((meeting) => meeting.days.map((day) => span(day, meeting.start, meeting.end))),
  );
}

export function spansOverlap(a: readonly Span[], b: readonly Span[]): boolean {
  return a.some((x) => b.some((y) => x.day === y.day && x.first < y.pastLast && y.first < x.pastLast));
}

/** Whether the engine keeps an option with these sections under the rules. */
export function meetsRules(sections: readonly Section[], rules: FitRules): boolean {
  const professor = rules.professor;
  if (professor && lecturesByProfessor(sections, professor).length === 0) return false;
  if (rules.onlyOpen && sections.some((section) => section.status !== "open")) return false;
  const early =
    rules.startsAfter !== 0 &&
    sections.some((section) => section.meetings.some((meeting) => meeting.start < rules.startsAfter));
  if (early) return false;
  const blocked = rules.blocked.map((time) => span(time.day, time.start, time.end));
  return !spansOverlap(meetingSpans(sections), blocked);
}
