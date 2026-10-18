import {
  browserPlanStorage,
  PLANS_STORAGE_PREFIX,
  readCurrentPlanIds,
  readPlans,
  removePlan,
  writeCurrentPlanId,
  writePlan,
  type PlanStorage,
} from "./storage";
import type { SavedPlan } from "./types";

export interface PlansSnapshot {
  plans: SavedPlan[];
  /** term id → the id of that term's current plan. */
  current: Record<string, string>;
}

export interface PlansSource {
  subscribe(listener: () => void): () => void;
  getSnapshot(): PlansSnapshot;
  /** Stores a new or changed plan. Returns false when the browser couldn't keep it. */
  save(plan: SavedPlan): boolean;
  rename(id: string, name: string): boolean;
  remove(id: string): void;
  setCurrent(termId: string, id: string | null): void;
}

/** Saved plans read from storage, kept in step with writes here and in other tabs. */
export function createPlansSource(getStorage: () => PlanStorage | null): PlansSource {
  const listeners = new Set<() => void>();
  let snapshot: PlansSnapshot | null = null;

  function changed() {
    snapshot = null;
    for (const listener of listeners) listener();
  }

  function onStorage(event: StorageEvent) {
    if (event.key === null || event.key.startsWith(PLANS_STORAGE_PREFIX)) changed();
  }

  function getSnapshot(): PlansSnapshot {
    if (!snapshot) {
      const storage = getStorage();
      snapshot = { plans: readPlans(storage), current: readCurrentPlanIds(storage) };
    }
    return snapshot;
  }

  return {
    subscribe(listener) {
      if (listeners.size === 0 && typeof window !== "undefined") window.addEventListener("storage", onStorage);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && typeof window !== "undefined") window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot,
    save(plan) {
      const saved = writePlan(getStorage(), plan);
      changed();
      return saved;
    },
    rename(id, name) {
      const plan = getSnapshot().plans.find((item) => item.id === id);
      if (!plan) return false;
      const saved = writePlan(getStorage(), { ...plan, name });
      changed();
      return saved;
    },
    remove(id) {
      removePlan(getStorage(), id);
      changed();
    },
    setCurrent(termId, id) {
      writeCurrentPlanId(getStorage(), termId, id);
      changed();
    },
  };
}

let shared: PlansSource | null = null;

/** The app's saved plans, in this browser's localStorage. */
export function getPlansSource(): PlansSource {
  shared ??= createPlansSource(browserPlanStorage);
  return shared;
}
