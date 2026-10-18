import type { SavedPlan } from "./types";

/** Plans grouped by term, terms in date order (term ids sort by date), plans in their given order. */
export function groupPlansByTerm(plans: readonly SavedPlan[]): SavedPlan[][] {
  const groups = new Map<string, SavedPlan[]>();
  for (const plan of plans) groups.set(plan.termId, [...(groups.get(plan.termId) ?? []), plan]);
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, group]) => group);
}
