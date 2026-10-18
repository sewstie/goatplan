/** Courses take the four palette colors in the order they were added, then the colors repeat (div.app-4.md). */
export type CourseSlot = 1 | 2 | 3 | 4;

export function courseSlot(courses: readonly string[], code: string): CourseSlot {
  const index = Math.max(0, courses.indexOf(code));
  return ((index % 4) + 1) as CourseSlot;
}

export interface CourseColors {
  /** A calendar block: fill, text and hover border. */
  block: string;
  /** The small square in "Your courses" and the "No set time" list. */
  swatch: string;
  /** The fill of a "No set time" item. */
  soft: string;
}

export const COURSE_COLORS: Readonly<Record<CourseSlot, CourseColors>> = {
  1: { block: "bg-course-1 text-on-accent hover:border-course-1-hover-line", swatch: "bg-course-1", soft: "bg-course-1-soft" },
  2: { block: "bg-course-2 text-ink hover:border-course-2-hover-line", swatch: "bg-course-2-swatch", soft: "bg-course-2-soft" },
  3: { block: "bg-course-3 text-ink hover:border-course-3-hover-line", swatch: "bg-course-3-swatch", soft: "bg-course-3-soft" },
  4: { block: "bg-course-4 text-ink hover:border-course-4-hover-line", swatch: "bg-course-4-swatch", soft: "bg-course-4-soft" },
};
