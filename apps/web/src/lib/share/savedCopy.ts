import type { SavedPlan } from "@/lib/plans/types";

function freeName(name: string, plans: readonly Pick<SavedPlan, "name" | "termId">[], termId: string): string {
  const taken = new Set(plans.filter((plan) => plan.termId === termId).map((plan) => plan.name.trim().toLowerCase()));
  let free = name;
  for (let number = 2; taken.has(free.toLowerCase()); number += 1) free = `${name} ${number}`;
  return free;
}

export function canSaveCopy(view: SavedPlan): boolean {
  return view.schedule.some((course) => course.sections.length > 0);
}

/** A saved plan can't hold a course without sections, so those stay only in `courses` and get new sections when opened. */
export function savedCopy(view: SavedPlan, plans: readonly Pick<SavedPlan, "name" | "termId">[], details: { id: string; savedAt: Date }): SavedPlan | null {
  if (!canSaveCopy(view)) return null;
  const copy = structuredClone(view);
  return {
    ...copy,
    id: details.id,
    name: freeName(view.name, plans, view.termId),
    savedAt: details.savedAt.toISOString(),
    schedule: copy.schedule.filter((course) => course.sections.length > 0),
  };
}
