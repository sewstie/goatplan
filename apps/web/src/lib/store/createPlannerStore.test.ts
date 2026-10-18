import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TermFile, TermSummary } from "@/lib/data/types";
import { EngineFailureError } from "@/lib/engine/EngineClient";
import type { LoadTermResponse, SolveRequest, SolveResponse } from "@/lib/engine/types";
import { createPlannerStore, SOLVE_DELAY_MS } from "./createPlannerStore";
import { draftKey, LAST_TERM_KEY, readDraft } from "./draft";
import { selectChosenSections } from "./selectors";
import { SORT_PRESETS } from "./sortPresets";
import { loaded, MemoryStorage, solved, termFile, termSummary } from "./testing/fixtures";

const NOW = new Date("2026-10-17T12:00:00Z");

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup(options: { storage?: MemoryStorage; terms?: TermSummary[] } = {}) {
  const storage = options.storage ?? new MemoryStorage();
  const buffers = new Map<string, ArrayBuffer>();
  const engine = {
    loadTerm: vi.fn<(termId: string, buffer?: ArrayBuffer | null) => Promise<LoadTermResponse>>(async (termId) =>
      loaded(termId),
    ),
    solve: vi.fn(async (request: SolveRequest): Promise<SolveResponse> => solved(request)),
  };
  const deps = {
    engine,
    loadTermIndex: vi.fn(async () => ({
      terms: options.terms ?? [termSummary("2027-C"), termSummary("2027-D", "2027-05-05")],
    })),
    loadTerm: vi.fn(async (termId: string): Promise<TermFile> => {
      buffers.set(termId, new ArrayBuffer(8));
      return termFile(termId);
    }),
    takeTermBuffer: vi.fn((termId: string) => {
      const buffer = buffers.get(termId) ?? null;
      buffers.delete(termId);
      return buffer;
    }),
    storage,
    now: () => NOW,
  };
  const store = createPlannerStore(deps);
  return { store, engine, deps, storage, state: () => store.getState() };
}

/** Lets pending promise callbacks run. */
const flush = () => vi.advanceTimersByTimeAsync(0);

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("init", () => {
  it("picks the first upcoming term and loads it into the engine with the file's bytes", async () => {
    const { state, engine, deps } = setup();
    await state().init();
    expect(state()).toMatchObject({ termId: "2027-C", termStatus: "ready", termError: null });
    expect(state().term?.term.id).toBe("2027-C");
    expect(deps.loadTerm).toHaveBeenCalledTimes(1);
    expect(engine.loadTerm).toHaveBeenCalledWith("2027-C", expect.any(ArrayBuffer));
  });

  it("prefers the term used last time and hides terms that have ended", async () => {
    const storage = new MemoryStorage();
    storage.setItem(LAST_TERM_KEY, "2027-D");
    const { state } = setup({
      storage,
      terms: [termSummary("2026-A", "2026-10-09"), termSummary("2027-C"), termSummary("2027-D", "2027-05-05")],
    });
    await state().init();
    expect(state().termId).toBe("2027-D");
    expect(state().terms.map((term) => term.id)).toEqual(["2027-C", "2027-D"]);
  });

  it("runs once, reports a failed index load, and can try again", async () => {
    const { state, deps } = setup();
    deps.loadTermIndex.mockRejectedValueOnce(new Error("offline"));
    await state().init();
    expect(state()).toMatchObject({ termStatus: "error", termError: "offline" });

    await Promise.all([state().init(), state().init()]);
    expect(deps.loadTermIndex).toHaveBeenCalledTimes(2);
    expect(state().termStatus).toBe("ready");
  });
});

describe("solving", () => {
  it("waits 200 ms after the last change, then asks the engine", async () => {
    const { state, engine } = setup();
    await state().init();
    state().addCourse("AE 2320");
    expect(state().solveStatus).toBe("waiting");

    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS - 1);
    expect(engine.solve).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(engine.solve).toHaveBeenCalledTimes(1);
    expect(engine.solve.mock.calls[0][0].courses).toEqual(["AE 2320"]);
    expect(state()).toMatchObject({ solveStatus: "done", scheduleIndex: 0 });
    expect(state().response?.ok).toBe(true);
  });

  it("collapses quick changes into one solve", async () => {
    const { state, engine } = setup();
    await state().init();
    state().addCourse("AE 2320");
    await vi.advanceTimersByTimeAsync(100);
    state().addCourse("AE 2410");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS - 1);
    expect(engine.solve).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(engine.solve).toHaveBeenCalledTimes(1);
    expect(engine.solve.mock.calls[0][0].courses).toEqual(["AE 2320", "AE 2410"]);
  });

  it("clears the answer without asking the engine when the plan is empty", async () => {
    const { state, engine } = setup();
    await state().init();
    state().addCourse("AE 2320");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    state().removeCourse("AE 2320");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    expect(engine.solve).toHaveBeenCalledTimes(1);
    expect(state()).toMatchObject({ response: null, solveStatus: "idle" });
  });

  it("keeps only the answer to the latest solve", async () => {
    const { state, engine } = setup();
    await state().init();
    const slow = deferred<SolveResponse>();
    engine.solve.mockImplementationOnce(() => slow.promise);

    state().addCourse("AE 2320");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    state().addCourse("AE 2410");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    slow.resolve(solved({ version: 1, courses: ["AE 2320"] }));
    await flush();

    const response = state().response;
    expect(response?.ok && response.schedules[0].courses.map((course) => course.code)).toEqual(["AE 2320", "AE 2410"]);
  });

  it("reloads the term and retries once when the engine lost it", async () => {
    const { state, engine } = setup();
    await state().init();
    engine.solve.mockResolvedValueOnce({
      ok: false,
      version: 1,
      error: { code: "noTerm", message: "No term loaded", detail: null },
    });
    state().addCourse("AE 2320");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    expect(engine.loadTerm).toHaveBeenLastCalledWith("2027-C");
    expect(engine.solve).toHaveBeenCalledTimes(2);
    expect(state()).toMatchObject({ solveStatus: "done" });
  });

  it("reports when the engine couldn't answer", async () => {
    const { state, engine } = setup();
    await state().init();
    engine.solve.mockRejectedValueOnce(new EngineFailureError("workerCrashed", "The engine worker crashed."));
    state().addCourse("AE 2320");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    expect(state()).toMatchObject({ solveStatus: "error", solveError: "The engine worker crashed." });
  });

  it("keeps engine errors as the response", async () => {
    const { state, engine } = setup();
    await state().init();
    const error: SolveResponse = { ok: false, version: 1, error: { code: "internal", message: "Bug", detail: null } };
    engine.solve.mockResolvedValueOnce(error);
    state().addCourse("AE 2320");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    expect(state()).toMatchObject({ response: error, solveStatus: "done" });
  });
});

describe("drafts", () => {
  it("saves the draft per term and restores it on the next visit", async () => {
    const storage = new MemoryStorage();
    const first = setup({ storage });
    await first.state().init();
    first.state().addCourse("AE 2320");
    first.state().setPreferences({ onlyOpen: false });
    first.state().lockSection("AE 2320", "AE 2320-CX02");
    expect(readDraft(storage, "2027-C")).toMatchObject({
      courses: ["AE 2320"],
      preferences: { onlyOpen: false },
      locks: { "AE 2320": ["AE 2320-CX02"] },
    });

    const second = setup({ storage });
    await second.state().init();
    expect(second.state()).toMatchObject({
      courses: ["AE 2320"],
      preferences: { startsAfter: 540, onlyOpen: false },
      locks: { "AE 2320": ["AE 2320-CX02"] },
    });
    expect(second.engine.solve).toHaveBeenCalledTimes(1);
  });

  it("keeps each term's own draft when switching terms", async () => {
    const { state, storage } = setup();
    await state().init();
    state().addCourse("AE 2320");

    await state().setTerm("2027-D");
    expect(state().courses).toEqual([]);
    state().addCourse("AB 1533");

    await state().setTerm("2027-C");
    expect(state().courses).toEqual(["AE 2320"]);
    await state().setTerm("2027-D");
    expect(state().courses).toEqual(["AB 1533"]);
    expect(storage.getItem(LAST_TERM_KEY)).toBe("2027-D");
  });

  it("ignores a broken saved draft", async () => {
    const storage = new MemoryStorage();
    storage.setItem(draftKey("2027-C"), "{oops");
    const { state } = setup({ storage });
    await state().init();
    expect(state()).toMatchObject({ termStatus: "ready", courses: [] });
  });

  it("drops saved courses and locks the term no longer has", async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      draftKey("2027-C"),
      JSON.stringify({
        version: 1,
        courses: ["AE 2320", "ZZ 9999"],
        preferences: { startsAfter: 0, blocked: [], onlyOpen: true },
        locks: { "AE 2320": ["AE 2320-ZZ99"] },
        sortPreset: "fewestEarly",
        alternatives: {},
      }),
    );
    const { state } = setup({ storage });
    await state().init();
    expect(state()).toMatchObject({ courses: ["AE 2320"], locks: {} });
  });

  it("ignores changes while the term is still loading", async () => {
    const { state, deps, storage } = setup();
    const slow = deferred<TermFile>();
    deps.loadTerm.mockImplementationOnce(() => slow.promise);
    const loading = state().setTerm("2027-C");
    state().addCourse("AE 2320");
    expect(state().courses).toEqual([]);
    expect(storage.getItem(draftKey("2027-C"))).toBeNull();
    slow.resolve(termFile("2027-C"));
    await loading;
    expect(state().termStatus).toBe("ready");
  });
});

describe("actions", () => {
  async function ready() {
    const context = setup();
    await context.state().init();
    return context;
  }

  it("adds known courses once and removes them with their locks and choices", async () => {
    const { state } = await ready();
    state().addCourse("AE 2320");
    state().addCourse("AE 2320");
    state().addCourse("ZZ 9999");
    state().addCourse("AE 2410");
    expect(state().courses).toEqual(["AE 2320", "AE 2410"]);

    state().lockSection("AE 2320", "AE 2320-CX02");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    state().chooseAlternative("AE 2320", ["AE 2320-CL01", "AE 2320-CX02"]);
    state().removeCourse("AE 2320");
    expect(state().courses).toEqual(["AE 2410"]);
    expect(state().locks).toEqual({});
    expect(Object.values(state().alternatives).every((choice) => !("AE 2320" in choice))).toBe(true);
  });

  it("locks and unlocks sections of courses in the plan", async () => {
    const { state, engine } = await ready();
    state().lockSection("AE 2320", "AE 2320-CX02");
    expect(state().locks).toEqual({});

    state().addCourse("AE 2320");
    state().lockSection("AE 2320", "AE 2320-CX02");
    state().lockSection("AE 2320", "AE 2320-CL01");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    expect(engine.solve.mock.calls.at(-1)![0].preferences?.locked).toEqual({
      "AE 2320": ["AE 2320-CX02", "AE 2320-CL01"],
    });

    state().unlockSection("AE 2320", "AE 2320-CX02");
    state().unlockSection("AE 2320", "AE 2320-CL01");
    expect(state().locks).toEqual({});
  });

  it("sends the sort preset's weights", async () => {
    const { state, engine } = await ready();
    state().addCourse("AE 2320");
    state().setSortPreset("fewestGaps");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    expect(engine.solve.mock.calls.at(-1)![0].sort).toEqual(SORT_PRESETS.fewestGaps.weights);
  });

  it("remembers the chosen alternative per schedule without solving again", async () => {
    const { state, engine } = await ready();
    state().addCourse("AE 2320");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);

    state().chooseAlternative("AE 2320", ["AE 2320-CL01", "AE 2320-CX02"]);
    state().chooseAlternative("AE 2320", ["AE 2320-CL01", "AE 2320-ZZ99"]);
    expect(selectChosenSections(state())).toEqual({ "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"] });

    state().nextSchedule();
    expect(selectChosenSections(state())).toEqual({ "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"] });
    state().previousSchedule();
    expect(selectChosenSections(state())).toEqual({ "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"] });
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    expect(engine.solve).toHaveBeenCalledTimes(1);
  });

  it("pages through schedules within bounds and starts again at the first after a new answer", async () => {
    const { state } = await ready();
    state().nextSchedule();
    expect(state().scheduleIndex).toBe(0);

    state().addCourse("AE 2320");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    state().previousSchedule();
    expect(state().scheduleIndex).toBe(0);
    state().nextSchedule();
    state().nextSchedule();
    expect(state().scheduleIndex).toBe(1);

    state().addCourse("AE 2410");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    expect(state().scheduleIndex).toBe(0);
  });

  it("applies each kind of diagnosis fix", async () => {
    const { state } = await ready();
    state().addCourse("AE 2320");
    state().addCourse("AB 1533");
    state().lockSection("AE 2320", "AE 2320-CX02");
    state().setPreferences({ blocked: [{ day: "Tue", start: 840, end: 960 }] });

    state().applyFix({ kind: "relaxStartsAfter", startsAfter: 480, schedules: 2, capped: false });
    expect(state().preferences.startsAfter).toBe(480);
    state().applyFix({ kind: "clearBlocked", schedules: 2, capped: false });
    expect(state().preferences.blocked).toEqual([]);
    state().applyFix({ kind: "allowFull", schedules: 2, capped: false });
    expect(state().preferences.onlyOpen).toBe(false);
    state().applyFix({ kind: "unlock", course: "AE 2320", schedules: 2, capped: false });
    expect(state().locks).toEqual({});
    state().applyFix({ kind: "dropCourse", course: "AB 1533", schedules: 2, capped: false });
    expect(state().courses).toEqual(["AE 2320"]);
  });
});

describe("switching terms", () => {
  it("ignores a slower load of an earlier term", async () => {
    const { state, deps } = setup();
    const slow = deferred<TermFile>();
    deps.loadTerm.mockImplementationOnce(() => slow.promise);
    const first = state().setTerm("2027-C");
    await state().setTerm("2027-D");
    slow.resolve(termFile("2027-C"));
    await first;
    expect(state()).toMatchObject({ termId: "2027-D", termStatus: "ready" });
    expect(state().term?.term.id).toBe("2027-D");
  });

  it("reports a term that can't be loaded", async () => {
    const { state, deps } = setup();
    deps.loadTerm.mockRejectedValueOnce(new Error("Couldn’t load /data/2027-C.json (HTTP 404)."));
    await state().setTerm("2027-C");
    expect(state()).toMatchObject({ termStatus: "error", termError: "Couldn’t load /data/2027-C.json (HTTP 404)." });
    await state().setTerm("not a term");
    expect(state()).toMatchObject({ termStatus: "error", termError: "There is no term not a term." });
  });
});
