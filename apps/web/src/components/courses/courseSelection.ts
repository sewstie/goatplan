import { create } from "zustand";

// Stand-in until the planner store has a selected course (asked for in the PR's "Needs from lead").
// The details panel can't follow this one; it only drives the selected row in "Your courses".

interface CourseSelection {
  selected: string | null;
  select(code: string | null): void;
}

export const useCourseSelection = create<CourseSelection>()((set) => ({
  selected: null,
  select: (code) => set({ selected: code }),
}));

/** The picked course while it's still planned, else the first planned course. */
export function selectedCourse(picked: string | null, courses: readonly string[]): string | null {
  return picked !== null && courses.includes(picked) ? picked : (courses[0] ?? null);
}
