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
import { findSchedule, scheduleKey, selectChosenSections, selectCurrentSchedule, selectSchedules } from "./selectors";
import type { AlternativeChoices, Draft, PlannerState, PlannerStore } from "./types";

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
  selectedCourse: null,
  selectedSection: null,
};

type Selection = Pick<PlannerState, "selectedCourse" | "selectedSection">;

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function draftOf(state: PlannerState): Draft {
  const { courses, preferences, locks, sortPreset, alternatives } = state;
  return { courses, preferences, locks, sortPreset, alternatives };
}

const sameSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((id) => b.includes(id));

function withoutKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  const copy = { ...record };
  delete copy[key];
  return copy;
}

/** Sets the picked alternatives of one schedule, replacing what was picked there before. */
function withChoices(alternatives: AlternativeChoices, key: string, choices: Record<string, string[]>): AlternativeChoices {
  const rest = withoutKey(alternatives, key);
  return Object.keys(choices).length > 0 ? { ...rest, [key]: choices } : rest;
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

    /** Asks the engine now. Resolves to false when a newer change or term made the answer moot. */
    async function runSolve(): Promise<boolean> {
      const state = get();
      const request = buildRequest(state);
      const termId = state.termId;
      if (!request || !termId || state.termStatus !== "ready") return false;

      const token = ++solveToken;
      set({ solveStatus: "solving", solveError: null });
      try {
        let response = await deps.engine.solve(request);
        if (!response.ok && response.error.code === "noTerm") {
          // A restarted worker lost the term: load it again (the worker fetches it) and retry once.
          await deps.engine.loadTerm(termId);
          response = await deps.engine.solve(request);
        }
        if (token !== solveToken) return false;
        set({ response, scheduleIndex: 0, solveStatus: "done" });
        return true;
      } catch (error) {
        if (token !== solveToken || error instanceof EngineSupersededError) return false;
        set({ solveStatus: "error", solveError: describe(error) });
        return true;
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
    function changeDraft(
      changes: (state: PlannerState) => (Partial<Draft> & Partial<Selection>) | null,
      options = { solve: true },
    ) {
      const state = get();
      if (state.termStatus !== "ready" || !state.termId) return;
      const update = changes(state);
      if (!update) return;
      set(update);
      writeDraft(deps.storage, state.termId, draftOf(get()));
      if (options.solve) scheduleSolve();
    }

    function removeCourse(state: PlannerState, code: string): (Partial<Draft> & Partial<Selection>) | null {
      const index = state.courses.indexOf(code);
      if (index < 0) return null;
      // A removed course hands the selection to its neighbour, like keyboard focus in "Your courses".
      const selection: Partial<Selection> =
        state.selectedCourse === code
          ? { selectedCourse: state.courses[index + 1] ?? state.courses[index - 1] ?? null, selectedSection: null }
          : {};
      return {
        ...selection,
        courses: state.courses.filter((course) => course !== code),
        locks: withoutKey(state.locks, code),
        alternatives: Object.fromEntries(
          Object.entries(state.alternatives).map(([key, choice]) => [key, withoutKey(choice, code)]),
        ),
      };
    }

    function setScheduleIndex(index: number) {
      const count = selectSchedules(get()).length;
      if (count === 0) return;
      set({ scheduleIndex: Math.min(count - 1, Math.max(0, Math.trunc(index))) });
    }

    /** Starts loading a term with the draft it should open with. Resolves to true once it's ready. */
    async function switchTerm(termId: string, draftFor: () => Draft): Promise<boolean> {
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
        selectedCourse: null,
        selectedSection: null,
      });
      try {
        if (!isTermId(termId)) throw new Error(`There is no term ${termId}.`);
        writeLastTerm(deps.storage, termId);
        const term = await deps.loadTerm(termId);
        if (token !== termToken) return false;
        // The term file's bytes move to the worker, so the file is downloaded only once.
        const loaded = await deps.engine.loadTerm(termId, deps.takeTermBuffer(termId));
        if (token !== termToken) return false;
        if (!loaded.ok) throw new Error(loaded.error.message);

        const draft = sanitizeDraft(draftFor(), term);
        set({ ...draft, term, termStatus: "ready", selectedCourse: draft.courses[0] ?? null });
        return true;
      } catch (error) {
        if (token !== termToken) return false;
        set({ termStatus: "error", termError: describe(error) });
        return false;
      }
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
        if (await switchTerm(termId, () => readDraft(deps.storage, termId) ?? emptyDraft())) void runSolve();
      },

      async openPlan(termId, plan, chosen = {}) {
        const draft: Draft = {
          courses: [...plan.courses],
          preferences: structuredClone(plan.preferences),
          locks: structuredClone(plan.locks),
          sortPreset: plan.sortPreset,
          alternatives: {},
        };
        const state = get();
        if (state.termId === termId && state.termStatus === "ready" && state.term) {
          clearSolveTimer();
          solveToken += 1;
          const sanitized = sanitizeDraft(draft, state.term);
          set({
            ...sanitized,
            response: null,
            scheduleIndex: 0,
            solveStatus: "idle",
            solveError: null,
            selectedCourse: sanitized.courses[0] ?? null,
            selectedSection: null,
          });
        } else if (!(await switchTerm(termId, () => draft))) {
          return false;
        }
        writeDraft(deps.storage, termId, draftOf(get()));
        if (!buildRequest(get())) return true;
        if (!(await runSolve()) || solveTimer) return false;

        const current = get();
        const found = findSchedule(selectSchedules(current), chosen);
        if (found) {
          const key = scheduleKey(selectSchedules(current)[found.index]);
          set({ scheduleIndex: found.index, alternatives: withChoices(current.alternatives, key, found.choices) });
          writeDraft(deps.storage, termId, draftOf(get()));
        }
        return true;
      },

      addCourse(code) {
        changeDraft((state) => {
          const known = state.term?.courses.some((course) => course.code === code);
          if (!known || state.courses.includes(code)) return null;
          return { courses: [...state.courses, code], selectedCourse: code, selectedSection: null };
        });
      },

      removeCourse(code) {
        changeDraft((state) => removeCourse(state, code));
      },

      selectCourse(code, sectionId = null) {
        if (code === null) {
          set({ selectedCourse: null, selectedSection: null });
          return;
        }
        if (get().courses.includes(code)) set({ selectedCourse: code, selectedSection: sectionId });
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

      pickOption(courseCode, sectionIds) {
        const state = get();
        const schedules = selectSchedules(state);
        const current = selectCurrentSchedule(state);
        const course = state.term?.courses.find((item) => item.code === courseCode);
        if (!current || !course || !state.termId || !state.courses.includes(courseCode)) return;
        if (!course.options.some((option) => sameSet(option, sectionIds))) return;

        const chosen = selectChosenSections(state);
        const shown = chosen[courseCode] ?? [];
        if (sameSet(shown, sectionIds)) return;
        const wanted = { ...chosen, [courseCode]: [...sectionIds] };
        const added = sectionIds.filter((id) => !shown.includes(id));
        const selection: Partial<Selection> =
          state.selectedCourse === courseCode && state.selectedSection && !sectionIds.includes(state.selectedSection)
            ? { selectedSection: added[0] ?? null }
            : {};

        // The shown schedule first, so a same-time pick doesn't page away from it.
        const here = findSchedule([current], wanted);
        const found = here ? { ...here, index: state.scheduleIndex } : findSchedule(schedules, wanted);
        if (found) {
          const key = scheduleKey(schedules[found.index]);
          set({ ...selection, scheduleIndex: found.index, alternatives: withChoices(state.alternatives, key, found.choices) });
          writeDraft(deps.storage, state.termId, draftOf(get()));
          return;
        }

        // Locks that the new option drops would leave nothing to show, so they go.
        changeDraft(() => {
          const kept = (state.locks[courseCode] ?? []).filter((id) => sectionIds.includes(id));
          return { ...selection, locks: { ...state.locks, [courseCode]: [...new Set([...kept, ...added])] } };
        });
      },

      setScheduleIndex(index) {
        setScheduleIndex(index);
      },

      nextSchedule() {
        setScheduleIndex(get().scheduleIndex + 1);
      },

      previousSchedule() {
        setScheduleIndex(get().scheduleIndex - 1);
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
