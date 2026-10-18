import { createStore, type StoreApi } from "zustand/vanilla";
import { isTermId } from "@/lib/data/load";
import { openTerms, pickDefaultTerm } from "@/lib/data/terms";
import type { TermFile, TermIndex } from "@/lib/data/types";
import { EngineSupersededError, type EngineClient } from "@/lib/engine/EngineClient";
import type { Fix } from "@/lib/engine/types";
import { buildRequest } from "./buildRequest";
import {
  emptyDraft,
  readDraft,
  readLastTerm,
  sanitizeDraft,
  writeDraft,
  writeLastTerm,
  type DraftStorage,
} from "./draft";
import { scheduleKey, selectCurrentSchedule, selectSchedules } from "./selectors";
import type { Draft, PlannerState, PlannerStore } from "./types";

/** How long the store waits after the last change before it asks the engine. */
export const SOLVE_DELAY_MS = 200;

export interface PlannerDeps {
  engine: Pick<EngineClient, "loadTerm" | "solve">;
  loadTermIndex(): Promise<TermIndex>;
  loadTerm(termId: string): Promise<TermFile>;
  takeTermBuffer(termId: string): ArrayBuffer | null;
  storage: DraftStorage | null;
  solveDelayMs?: number;
  now?: () => Date;
}

const initialState: PlannerState = {
  ...emptyDraft(),
  terms: [],
  termId: null,
  term: null,
  termStatus: "idle",
  termError: null,
  response: null,
  scheduleIndex: 0,
  solveStatus: "idle",
  solveError: null,
};

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function draftOf(state: PlannerState): Draft {
  const { courses, preferences, locks, sortPreset, alternatives } = state;
  return { courses, preferences, locks, sortPreset, alternatives };
}

function withoutKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  const copy = { ...record };
  delete copy[key];
  return copy;
}

export function createPlannerStore(deps: PlannerDeps): StoreApi<PlannerStore> {
  const solveDelayMs = deps.solveDelayMs ?? SOLVE_DELAY_MS;
  const now = deps.now ?? (() => new Date());
  let solveTimer: ReturnType<typeof setTimeout> | null = null;
  // Each new term load or solve bumps its token, so answers to older ones are dropped.
  let termToken = 0;
  let solveToken = 0;
  let initialized: Promise<void> | null = null;

  return createStore<PlannerStore>()((set, get) => {
    function clearSolveTimer() {
      if (solveTimer) clearTimeout(solveTimer);
      solveTimer = null;
    }

    async function runSolve() {
      const state = get();
      const request = buildRequest(state);
      const termId = state.termId;
      if (!request || !termId || state.termStatus !== "ready") return;

      const token = ++solveToken;
      set({ solveStatus: "solving", solveError: null });
      try {
        let response = await deps.engine.solve(request);
        if (!response.ok && response.error.code === "noTerm") {
          // A restarted worker lost the term: load it again (the worker fetches it) and retry once.
          await deps.engine.loadTerm(termId);
          response = await deps.engine.solve(request);
        }
        if (token !== solveToken) return;
        set({ response, scheduleIndex: 0, solveStatus: "done" });
      } catch (error) {
        if (token !== solveToken || error instanceof EngineSupersededError) return;
        set({ solveStatus: "error", solveError: describe(error) });
      }
    }

    function scheduleSolve() {
      clearSolveTimer();
      if (get().termStatus !== "ready") return;
      if (!buildRequest(get())) {
        solveToken += 1;
        set({ response: null, scheduleIndex: 0, solveStatus: "idle", solveError: null });
        return;
      }
      set({ solveStatus: "waiting" });
      solveTimer = setTimeout(() => {
        solveTimer = null;
        void runSolve();
      }, solveDelayMs);
    }

    /** Changes the draft, saves it for this term and solves again. Ignored until the term is ready. */
    function changeDraft(changes: (state: PlannerState) => Partial<Draft> | null, options = { solve: true }) {
      const state = get();
      if (state.termStatus !== "ready" || !state.termId) return;
      const update = changes(state);
      if (!update) return;
      set(update);
      writeDraft(deps.storage, state.termId, draftOf(get()));
      if (options.solve) scheduleSolve();
    }

    function removeCourse(state: PlannerState, code: string): Partial<Draft> | null {
      if (!state.courses.includes(code)) return null;
      return {
        courses: state.courses.filter((course) => course !== code),
        locks: withoutKey(state.locks, code),
        alternatives: Object.fromEntries(
          Object.entries(state.alternatives).map(([key, choice]) => [key, withoutKey(choice, code)]),
        ),
      };
    }

    function moveSchedule(step: number) {
      const count = selectSchedules(get()).length;
      if (count === 0) return;
      set({ scheduleIndex: Math.min(count - 1, Math.max(0, get().scheduleIndex + step)) });
    }

    return {
      ...initialState,

      init() {
        initialized ??= (async () => {
          try {
            const index = await deps.loadTermIndex();
            const terms = openTerms(index.terms, now());
            set({ terms });
            const pick = pickDefaultTerm(terms, readLastTerm(deps.storage), now());
            if (!pick) {
              set({ termStatus: "error", termError: "No terms are open right now." });
              return;
            }
            await get().setTerm(pick.id);
          } catch (error) {
            initialized = null;
            set({ termStatus: "error", termError: describe(error) });
          }
        })();
        return initialized;
      },

      async setTerm(termId) {
        const token = ++termToken;
        clearSolveTimer();
        solveToken += 1;
        set({
          ...emptyDraft(),
          termId,
          term: null,
          termStatus: "loading",
          termError: null,
          response: null,
          scheduleIndex: 0,
          solveStatus: "idle",
          solveError: null,
        });
        try {
          if (!isTermId(termId)) throw new Error(`There is no term ${termId}.`);
          writeLastTerm(deps.storage, termId);
          const term = await deps.loadTerm(termId);
          if (token !== termToken) return;
          // The term file's bytes move to the worker, so the file is downloaded only once.
          const loaded = await deps.engine.loadTerm(termId, deps.takeTermBuffer(termId));
          if (token !== termToken) return;
          if (!loaded.ok) throw new Error(loaded.error.message);

          const draft = sanitizeDraft(readDraft(deps.storage, termId) ?? emptyDraft(), term);
          set({ ...draft, term, termStatus: "ready" });
          void runSolve();
        } catch (error) {
          if (token !== termToken) return;
          set({ termStatus: "error", termError: describe(error) });
        }
      },

      addCourse(code) {
        changeDraft((state) => {
          const known = state.term?.courses.some((course) => course.code === code);
          return known && !state.courses.includes(code) ? { courses: [...state.courses, code] } : null;
        });
      },

      removeCourse(code) {
        changeDraft((state) => removeCourse(state, code));
      },

      setPreferences(changes) {
        changeDraft((state) => ({ preferences: { ...state.preferences, ...changes } }));
      },

      lockSection(courseCode, sectionId) {
        changeDraft((state) => {
          const locked = state.locks[courseCode] ?? [];
          if (!state.courses.includes(courseCode) || locked.includes(sectionId)) return null;
          return { locks: { ...state.locks, [courseCode]: [...locked, sectionId] } };
        });
      },

      unlockSection(courseCode, sectionId) {
        changeDraft((state) => {
          const locked = state.locks[courseCode] ?? [];
          if (!locked.includes(sectionId)) return null;
          const rest = locked.filter((id) => id !== sectionId);
          return {
            locks: rest.length > 0 ? { ...state.locks, [courseCode]: rest } : withoutKey(state.locks, courseCode),
          };
        });
      },

      setSortPreset(preset) {
        changeDraft((state) => (state.sortPreset === preset ? null : { sortPreset: preset }));
      },

      chooseAlternative(courseCode, sectionIds) {
        changeDraft(
          (state) => {
            const schedule = selectCurrentSchedule(state);
            const course = schedule?.courses.find((item) => item.code === courseCode);
            const isAlternative = course?.alternatives.some(
              (option) => option.length === sectionIds.length && option.every((id, i) => id === sectionIds[i]),
            );
            if (!schedule || !isAlternative) return null;
            const key = scheduleKey(schedule);
            return {
              alternatives: {
                ...state.alternatives,
                [key]: { ...state.alternatives[key], [courseCode]: [...sectionIds] },
              },
            };
          },
          { solve: false },
        );
      },

      nextSchedule() {
        moveSchedule(1);
      },

      previousSchedule() {
        moveSchedule(-1);
      },

      applyFix(fix: Fix) {
        switch (fix.kind) {
          case "relaxStartsAfter":
            get().setPreferences({ startsAfter: fix.startsAfter });
            break;
          case "clearBlocked":
            get().setPreferences({ blocked: [] });
            break;
          case "allowFull":
            get().setPreferences({ onlyOpen: false });
            break;
          case "unlock":
            changeDraft((state) => ({ locks: withoutKey(state.locks, fix.course) }));
            break;
          case "dropCourse":
            get().removeCourse(fix.course);
            break;
        }
      },
    };
  });
}
