import type { Course, Day, Delivery, Section, TermFile } from "@/lib/data/types";
import { courseSlot, type CourseSlot } from "@/components/ui/courseColors";

interface ItemBase {
  courseCode: string;
  /** The section's own title when it has one (topic courses), else the course title. */
  title: string;
  sectionId: string;
  sectionCode: string;
  instructors: string[];
  slot: CourseSlot;
  locked: boolean;
}

/** One meeting of a chosen section on one day: one block on the calendar. */
export interface ClassItem extends ItemBase {
  key: string;
  day: Day;
  start: number;
  end: number;
  location: string;
}

/** A chosen section with no meeting times, listed under "No set time" (div.app-13.md). */
export interface UntimedItem extends ItemBase {
  delivery: Delivery;
}

export interface ScheduleItems {
  classes: ClassItem[];
  untimed: UntimedItem[];
  /** Chosen sections that are full with a waitlist (div.app-15.md). */
  waitlisted: { courseCode: string; sectionCode: string }[];
}

const EMPTY: ScheduleItems = { classes: [], untimed: [], waitlisted: [] };

/**
 * Everything the calendar draws for the shown schedule, in the order the courses were added.
 * Courses that are no longer in the plan are left out, so a removed course disappears before the
 * engine answers again.
 */
export function scheduleItems(
  term: TermFile | null,
  courses: readonly string[],
  chosen: Readonly<Record<string, readonly string[]>>,
  locks: Readonly<Record<string, readonly string[]>>,
): ScheduleItems {
  if (!term) return EMPTY;
  const courseByCode = new Map<string, Course>(term.courses.map((course) => [course.code, course]));
  const result: ScheduleItems = { classes: [], untimed: [], waitlisted: [] };

  for (const code of courses) {
    const course = courseByCode.get(code);
    const sectionIds = chosen[code];
    if (!course || !sectionIds) continue;
    const sectionById = new Map<string, Section>(course.sections.map((section) => [section.id, section]));

    for (const sectionId of sectionIds) {
      const section = sectionById.get(sectionId);
      if (!section) continue;
      const base: ItemBase = {
        courseCode: code,
        title: section.title ?? course.title,
        sectionId,
        sectionCode: section.code,
        instructors: section.instructors,
        slot: courseSlot(courses, code),
        locked: locks[code]?.includes(sectionId) ?? false,
      };
      if (section.status === "waitlist") result.waitlisted.push({ courseCode: code, sectionCode: section.code });
      if (section.meetings.length === 0) {
        result.untimed.push({ ...base, delivery: section.delivery });
        continue;
      }
      for (const meeting of section.meetings) {
        for (const day of meeting.days) {
          result.classes.push({
            ...base,
            key: `${sectionId}|${day}|${meeting.start}`,
            day,
            start: meeting.start,
            end: meeting.end,
            location: meeting.location,
          });
        }
      }
    }
  }
  return result;
}
