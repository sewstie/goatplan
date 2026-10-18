import type { TermStatus } from "@/lib/store";
import { hasUnsavedChanges, type WorkingPlan } from "./compare";
import type { SavedPlan } from "./types";

export interface SaveState {
  /** "saved" and "unsaved" only when the working plan came from a saved plan and a schedule is shown. */
  status: "none" | "saved" | "unsaved";
  /** The plan the working draft was saved as or opened from. */
  currentPlan: SavedPlan | null;
  /** Save schedule can be pressed: a schedule is shown and it isn't saved as it is. */
  canSave: boolean;
  /** The plan buttons are off while the term loads. */
  busy: boolean;
}

export function getSaveState(input: {
  termStatus: TermStatus;
  hasSchedule: boolean;
  currentPlan: SavedPlan | null;
  working: WorkingPlan;
}): SaveState {
  const busy = input.termStatus === "idle" || input.termStatus === "loading";
  const currentPlan = input.currentPlan;
  if (input.termStatus !== "ready" || !input.hasSchedule) {
    return { status: "none", currentPlan, canSave: false, busy };
  }
  if (!currentPlan) return { status: "none", currentPlan, canSave: true, busy };
  const unsaved = hasUnsavedChanges(currentPlan, input.working);
  return { status: unsaved ? "unsaved" : "saved", currentPlan, canSave: unsaved, busy };
}
