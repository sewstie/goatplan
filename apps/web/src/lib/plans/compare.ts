import type { Draft, PlanBlockedTime } from "@/lib/store";
import type { SavedPlan } from "./types";

/** The parts of the working plan that "Unsaved changes" looks at. */
export interface WorkingPlan extends Pick<Draft, "courses" | "locks" | "preferences"> {
  /** course code → section ids in the shown schedule, or null when no schedule is shown. */
  chosen: Record<string, string[]> | null;
}

const sameSet = (a: readonly string[], b: readonly string[]) => {
  const left = new Set(a);
  const right = new Set(b);
  return left.size === right.size && [...left].every((item) => right.has(item));
};

function sameGroups(a: Record<string, readonly string[]>, b: Record<string, readonly string[]>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((key) => sameSet(a[key] ?? [], b[key] ?? []));
}

// A renamed blocked time counts as a change too.
const blockKey = (block: PlanBlockedTime) => `${block.day} ${block.start} ${block.end} ${block.label?.trim() ?? ""}`;

/**
 * Opening a plan replaces its term's working draft. True when that draft has courses that aren't
 * saved as they are, so the student should confirm first.
 */
export function wouldDiscardWork(currentPlan: SavedPlan | null, working: WorkingPlan | null): boolean {
  if (!working || working.courses.length === 0) return false;
  return !currentPlan || hasUnsavedChanges(currentPlan, working);
}

/** True when the working plan differs from the saved one in courses, sections, locks or preferences. */
export function hasUnsavedChanges(plan: SavedPlan, working: WorkingPlan): boolean {
  if (!sameSet(plan.courses, working.courses)) return true;
  if (!sameGroups(plan.locks, working.locks)) return true;
  const saved = plan.preferences;
  const current = working.preferences;
  if (saved.startsAfter !== current.startsAfter || saved.onlyOpen !== current.onlyOpen) return true;
  if (!sameSet(saved.blocked.map(blockKey), current.blocked.map(blockKey))) return true;
  if (working.chosen === null) return false;
  const savedSections = Object.fromEntries(
    plan.schedule.map((course) => [course.code, course.sections.map((section) => section.id)]),
  );
  return !sameSet(Object.keys(savedSections), Object.keys(working.chosen)) || !sameGroups(savedSections, working.chosen);
}
