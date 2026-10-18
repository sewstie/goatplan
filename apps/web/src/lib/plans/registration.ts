import {
  formatDays,
  formatTimeRange,
  openSeats,
  sectionTypeName,
  type Section,
  type Term,
  type TermFile,
} from "@/lib/data";
import { sectionChange } from "./changes";
import type { PlanChange, SavedCourse, SavedPlan } from "./types";

export interface RegistrationRow {
  /** The section id, unique within the term. */
  id: string;
  course: string;
  courseTitle: string;
  section: string;
  /** "Lecture · 36 open" */
  seats: string;
  /** "Mon–Fri · 9:00–9:50 AM", one line per meeting. */
  meetings: string[];
  room: string;
  instructors: string;
  /** What changed since the plan was saved, when the latest data is known. */
  change: PlanChange | null;
}

/** Lectures first, then the other types; otherwise the saved order. */
export function registrationOrder(sections: readonly Section[]): Section[] {
  return [...sections].sort((a, b) => Number(a.type !== "lecture") - Number(b.type !== "lecture"));
}

/** "Mon–Fri · 9:00–9:50 AM" per meeting, or "No set time". */
export function meetingLines(section: Pick<Section, "meetings">): string[] {
  if (section.meetings.length === 0) return ["No set time"];
  return section.meetings.map(
    (meeting) => `${formatDays(meeting.days)} · ${formatTimeRange(meeting.start, meeting.end, "shared")}`,
  );
}

function rooms(section: Section): string {
  const names = [...new Set(section.meetings.map((meeting) => meeting.location.trim()).filter(Boolean))];
  return names.length > 0 ? names.join(", ") : "No room listed";
}

function instructors(section: Section): string {
  const names = section.instructors.map((name) => name.trim()).filter(Boolean);
  return names.length > 0 ? names.join(", ") : "No instructor yet";
}

/**
 * One row per saved section, grouped by course in plan order, lecture before lab. Rows show the
 * latest data when the term file is known and the section still exists, else the saved copy.
 */
export function registrationRows(plan: SavedPlan, term: TermFile | null): RegistrationRow[] {
  const courses = new Map(term?.courses.map((course) => [course.code, course]));
  return plan.schedule.flatMap((saved) => {
    const course = courses.get(saved.code);
    return registrationOrder(saved.sections).map((savedSection) => {
      const latest = course?.sections.find((section) => section.id === savedSection.id);
      const shown = latest ?? savedSection;
      let change: PlanChange | null = null;
      if (term) change = course ? sectionChange(saved.code, savedSection, latest) : { kind: "courseRemoved", course: saved.code };
      const gone = change?.kind === "sectionRemoved" || change?.kind === "courseRemoved";
      return {
        id: savedSection.id,
        course: saved.code,
        courseTitle: course?.title ?? saved.title,
        section: shown.code,
        // A removed section's old seat count would mislead.
        seats: gone ? sectionTypeName(shown.type) : `${sectionTypeName(shown.type)} · ${openSeats(shown)} open`,
        meetings: meetingLines(shown),
        room: rooms(shown),
        instructors: instructors(shown),
        change,
      };
    });
  });
}

/** "AE 2320 — CL01 (lecture), CX02 (lab)", one course per line, for pasting into Workday. */
export function sectionListText(schedule: readonly SavedCourse[]): string {
  return schedule
    .map((course) => {
      const sections = registrationOrder(course.sections).map(
        (section) => `${section.code} (${sectionTypeName(section.type).toLowerCase()})`,
      );
      return `${course.code} — ${sections.join(", ")}`;
    })
    .join("\n");
}

export function sectionCount(plan: Pick<SavedPlan, "schedule">): number {
  return plan.schedule.reduce((count, course) => count + course.sections.length, 0);
}

export function countLabel(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** "C Term · Spring 2027" */
export function termLabel(term: Pick<Term, "name" | "season" | "year">): string {
  return `${term.name} · ${term.season} ${term.year}`;
}

const savedDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

/** "Saved Oct 17, 2026", in the browser's time zone. */
export function savedLabel(savedAt: string): string {
  const date = new Date(savedAt);
  return Number.isNaN(date.getTime()) ? "Saved" : `Saved ${savedDate.format(date)}`;
}
