import { waitFor } from "@testing-library/react";
import { expect } from "vitest";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";
import type { TermFile } from "@/lib/data/types";
import type { SolveRequest, SolveResponse } from "@/lib/engine/types";
import { createPlannerStore } from "@/lib/store/createPlannerStore";
import { draftKey, emptyDraft } from "@/lib/store/draft";
import { loaded, MemoryStorage, solved, termFile, termSummary } from "@/lib/store/testing/fixtures";
import type { Draft, PlannerStore } from "@/lib/store/types";

// A real planner store with a fake engine, for component tests. Test files swap it in with:
// vi.mock("@/lib/store", async (importOriginal) => ({
//   ...(await importOriginal<typeof import("@/lib/store")>()),
//   usePlanner: (await import("@/components/sections/testing/plannerStore")).useTestPlanner,
// }));

let current: StoreApi<PlannerStore> | null = null;

export function useTestPlanner<T>(selector: (state: PlannerStore) => T): T {
  if (!current) throw new Error("Call startTestPlanner() before rendering.");
  return useStore(current, selector);
}

type Options = {
  term?: TermFile;
  /** Replaces the term download, e.g. to keep it loading or make it fail. */
  loadTerm?: () => Promise<TermFile>;
  solve?: (request: SolveRequest) => SolveResponse;
  /** false starts the store without waiting for the term or an answer. */
  wait?: boolean;
};

/** Opens term 2027-C with this draft and waits for the first answer. */
export async function startTestPlanner(draft: Partial<Draft> = {}, options: Options = {}) {
  const storage = new MemoryStorage();
  storage.setItem(draftKey("2027-C"), JSON.stringify({ version: 1, ...emptyDraft(), ...draft }));
  const requests: SolveRequest[] = [];
  const store = createPlannerStore({
    engine: {
      loadTerm: async (termId) => loaded(termId),
      solve: async (request) => {
        requests.push(request);
        return (options.solve ?? solved)(request);
      },
    },
    loadTermIndex: async () => ({ terms: [termSummary("2027-C")] }),
    loadTerm: options.loadTerm ?? (async () => options.term ?? termFile("2027-C")),
    takeTermBuffer: () => null,
    storage,
    solveDelayMs: 0,
    now: () => new Date("2026-10-17T12:00:00Z"),
  });
  current = store;
  if (options.wait === false) {
    void store.getState().init();
    return { store, requests };
  }
  await store.getState().init();
  await waitForSolve(store);
  return { store, requests };
}

/** Waits until the store has no solve waiting or running. */
export async function waitForSolve(store: StoreApi<PlannerStore>) {
  await waitFor(() => expect(["done", "idle", "error"]).toContain(store.getState().solveStatus));
}

/** jsdom has no modal dialogs: open and close them by their attribute. */
export function polyfillDialog() {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}
