import type { Schedule } from "@/lib/engine/types";
import type { PlannerState } from "./types";

/** Identifies a schedule by the sections it shows, so a choice survives a re-solve that returns the same schedule. */
export function scheduleKey(schedule: Schedule): string {
  return schedule.courses.map((course) => course.sections.join("+")).join("|");
}

const NO_SCHEDULES: Schedule[] = [];

export function selectSchedules(state: Pick<PlannerState, "response">): Schedule[] {
  return state.response?.ok ? state.response.schedules : NO_SCHEDULES;
}

export function selectCurrentSchedule(state: Pick<PlannerState, "response" | "scheduleIndex">): Schedule | null {
  return selectSchedules(state)[state.scheduleIndex] ?? null;
}

const sameSections = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id, index) => id === b[index]);

const sameSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((id) => b.includes(id));

/**
 * The first schedule that can show these sections (course code → section ids) for all its courses,
 * with the alternatives to pick where they differ from the sections the engine shows.
 */
export function findSchedule(
  schedules: readonly Schedule[],
  wanted: Readonly<Record<string, readonly string[]>>,
): { index: number; choices: Record<string, string[]> } | null {
  for (const [index, schedule] of schedules.entries()) {
    const choices: Record<string, string[]> = {};
    const fits = schedule.courses.every((course) => {
      const ids = wanted[course.code];
      const option = ids && course.alternatives.find((alternative) => sameSet(alternative, ids));
      if (!option) return false;
      if (!sameSet(option, course.sections)) choices[course.code] = option;
      return true;
    });
    if (fits) return { index, choices };
  }
  return null;
}

/**
 * course code → the section ids the student takes in the current schedule: the alternative they
 * picked, or the one the engine shows. Builds a new object, so read it with useShallow or useMemo.
 */
export function selectChosenSections(
  state: Pick<PlannerState, "response" | "scheduleIndex" | "alternatives">,
): Record<string, string[]> {
  const schedule = selectCurrentSchedule(state);
  if (!schedule) return {};
  const choices = state.alternatives[scheduleKey(schedule)] ?? {};
  return Object.fromEntries(
    schedule.courses.map((course) => {
      const picked = choices[course.code];
      const valid = picked && course.alternatives.some((option) => sameSections(option, picked));
      return [course.code, valid ? picked : course.sections];
    }),
  );
}
