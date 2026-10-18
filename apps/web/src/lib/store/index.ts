import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";
import { loadTerm, loadTermIndex, takeTermBuffer } from "@/lib/data/load";
import { getEngineClient } from "@/lib/engine";
import { createPlannerStore } from "./createPlannerStore";
import { browserStorage, readDraft } from "./draft";
import type { Draft, PlannerStore } from "./types";

export * from "./types";
export { buildRequest, MAX_SCHEDULES } from "./buildRequest";
export { SORT_PRESETS, SORT_PRESET_IDS } from "./sortPresets";
export { DEFAULT_PREFERENCES } from "./draft";
export { SOLVE_DELAY_MS } from "./createPlannerStore";
export { findSchedule, scheduleKey, selectChosenSections, selectCurrentSchedule, selectSchedules } from "./selectors";

let store: StoreApi<PlannerStore> | null = null;

/** The app's one planner store. Its actions only run in the browser (PlannerBootstrap calls init). */
export function getPlannerStore(): StoreApi<PlannerStore> {
  store ??= createPlannerStore({
    engine: getEngineClient(),
    loadTermIndex,
    loadTerm,
    takeTermBuffer,
    storage: browserStorage(),
  });
  return store;
}

/** The draft this browser keeps for a term, or null. Lets plans check for unsaved work in a term that isn't open. */
export function storedDraft(termId: string): Draft | null {
  return readDraft(browserStorage(), termId);
}

/**
 * Reads from the planner store and re-renders when the selected value changes. Select single values,
 * or wrap selectors that build objects in useShallow (zustand/react/shallow).
 */
export function usePlanner<T>(selector: (state: PlannerStore) => T): T {
  return useStore(getPlannerStore(), selector);
}
