import { usePlanner } from "@/lib/store";

/**
 * The course the details panel shows. Stand-in until the store keeps a selected course (asked from
 * the lead): for now it's the first course in the plan.
 */
export function useSelectedCourse(): string | null {
  return usePlanner((state) => state.courses[0] ?? null);
}
