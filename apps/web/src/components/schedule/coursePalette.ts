/** Courses take the four palette colors in the order they were added, then the colors repeat (div.app-4.md). */
export type CourseSlot = 1 | 2 | 3 | 4;

export function courseSlot(courses: readonly string[], code: string): CourseSlot {
  const index = Math.max(0, courses.indexOf(code));
  return ((index % 4) + 1) as CourseSlot;
}

// Hover borders for slots 1, 3 and 4 and soft fills for slots 1–3 have no tokens yet (tokens.md), so they
// are mixed from the slot's own colors until the lead adds them.
export const blockClasses: Readonly<Record<CourseSlot, string>> = {
  1: "bg-course-1 text-on-accent hover:border-ink",
  2: "bg-course-2 text-ink hover:border-course-2-hover-line",
  3: "bg-course-3 text-ink hover:border-[color-mix(in_srgb,var(--color-course-3-swatch)_75%,black)]",
  4: "bg-course-4 text-ink hover:border-[color-mix(in_srgb,var(--color-course-4-swatch)_75%,black)]",
};

export const swatchClasses: Readonly<Record<CourseSlot, string>> = {
  1: "bg-course-1",
  2: "bg-course-2-swatch",
  3: "bg-course-3-swatch",
  4: "bg-course-4-swatch",
};

export const softClasses: Readonly<Record<CourseSlot, string>> = {
  1: "bg-[color-mix(in_srgb,var(--color-course-1)_8%,var(--color-surface))]",
  2: "bg-[color-mix(in_srgb,var(--color-course-2-swatch)_15%,var(--color-surface))]",
  3: "bg-[color-mix(in_srgb,var(--color-course-3-swatch)_15%,var(--color-surface))]",
  4: "bg-course-4-soft",
};
