// The order of the course colors in the designs (div.app-4.md). The calendar should use the same order;
// a shared helper is asked for in the PR's "Needs from lead".
const SWATCHES = ["bg-course-1", "bg-course-2-swatch", "bg-course-3-swatch", "bg-course-4-swatch"] as const;

/** The swatch class for the course at this position in the plan. */
export function courseSwatch(position: number): string {
  return SWATCHES[position % SWATCHES.length];
}
