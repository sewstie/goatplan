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

/** Like the fixture engine, but each schedule shows one lab with no same-time alternative. */
function separateLabs(request: SolveRequest, count = 2): SolveResponse {
  const response = solved(request);
  if (!response.ok) return response;
  response.schedules = response.schedules.slice(0, count);
  for (const schedule of response.schedules) {
    for (const course of schedule.courses) course.alternatives = [[...course.sections]];
  }
  return response;
}

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

  it("retains the last displayed choices for diagnosis previews without saving them in the draft", async () => {
    const { state, engine, storage } = await ready();
    engine.solve.mockImplementation(async (request) => separateLabs(request));
    state().addCourse("AE 2320");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    state().setScheduleIndex(1);
    const chosen = selectChosenSections(state());
    engine.solve.mockImplementation(async (request) => ({ ...solved(request), total: 0, patterns: 0, schedules: [] }));
    state().setPreferences({ startsAfter: 600 });
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    expect(state().lastChosenSections).toEqual(chosen);
    expect(selectChosenSections(state())).toEqual({});
    expect(JSON.parse(storage.getItem(draftKey("2027-C"))!)).not.toHaveProperty("lastChosenSections");
    await state().setTerm("2027-D");
    expect(state().lastChosenSections).toEqual({});
  });

  it("retries a failed engine request without changing the draft", async () => {
    const { state, engine } = await ready();
    engine.solve.mockRejectedValueOnce(new Error("Worker crashed"));
    state().addCourse("AE 2320");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    expect(state().solveStatus).toBe("error");
    await state().retrySolve();
    expect(state().solveStatus).toBe("done");
    expect(engine.solve).toHaveBeenCalledTimes(2);
    expect(engine.solve.mock.calls[0][0]).toEqual(engine.solve.mock.calls[1][0]);
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

describe("selected course", () => {
  async function ready(storage = new MemoryStorage()) {
    const context = setup({ storage });
    await context.state().init();
    return context;
  }

  it("is the first planned course once the term loads, and nothing while it loads", async () => {
    const storage = new MemoryStorage();
    storage.setItem(
      draftKey("2027-C"),
      JSON.stringify({
        version: 1,
        courses: ["AE 2410", "AE 2320"],
        preferences: { startsAfter: 0, blocked: [], onlyOpen: true },
        locks: {},
        sortPreset: "fewestEarly",
        alternatives: {},
      }),
    );
    const { state, deps } = setup({ storage });
    const slow = deferred<TermFile>();
    deps.loadTerm.mockImplementationOnce(() => slow.promise);
    const loading = state().init();
    await flush();
    expect(state()).toMatchObject({ termStatus: "loading", selectedCourse: null });
    slow.resolve(termFile("2027-C"));
    await loading;
    expect(state()).toMatchObject({ selectedCourse: "AE 2410", selectedSection: null });

    await state().setTerm("2027-D");
    expect(state().selectedCourse).toBeNull();
  });

  it("follows a new course and isn't saved with the draft", async () => {
    const { state, storage } = await ready();
    state().addCourse("AE 2320");
    state().addCourse("AE 2410");
    expect(state().selectedCourse).toBe("AE 2410");
    expect(storage.getItem(draftKey("2027-C"))).not.toContain("selected");
  });

  it("selects a planned course and one of its sections, and ignores other courses", async () => {
    const { state } = await ready();
    state().addCourse("AE 2320");
    state().addCourse("AE 2410");
    state().selectCourse("AE 2320", "AE 2320-CX02");
    expect(state()).toMatchObject({ selectedCourse: "AE 2320", selectedSection: "AE 2320-CX02" });
    state().selectCourse("AB 1533");
    expect(state()).toMatchObject({ selectedCourse: "AE 2320", selectedSection: "AE 2320-CX02" });
    state().selectCourse("AE 2410");
    expect(state()).toMatchObject({ selectedCourse: "AE 2410", selectedSection: null });
    state().selectCourse(null);
    expect(state()).toMatchObject({ selectedCourse: null, selectedSection: null });
  });

  it("moves to the next course, else the one before, when the selected course is removed", async () => {
    const { state } = await ready();
    for (const code of ["AE 2320", "AE 2410", "AB 1533"]) state().addCourse(code);
    state().selectCourse("AE 2410", "AE 2410-C01");
    state().removeCourse("AE 2410");
    expect(state()).toMatchObject({ selectedCourse: "AB 1533", selectedSection: null });
    state().removeCourse("AB 1533");
    expect(state().selectedCourse).toBe("AE 2320");
    state().addCourse("AE 2410");
    state().selectCourse("AE 2320");
    state().removeCourse("AE 2410");
    expect(state().selectedCourse).toBe("AE 2320");
    state().removeCourse("AE 2320");
    expect(state().selectedCourse).toBeNull();
  });
});

describe("professor preferences", () => {
  it("re-solves, keeps matching locks and removes only locks taught by someone else", async () => {
    const { state, engine, storage } = setup();
    await state().init();
    state().term!.courses[0].sections[1].instructors = ["Other Professor"];
    state().addCourse("AE 2320");
    state().addCourse("AE 2410");
    state().lockSection("AE 2320", "AE 2320-CL01");
    state().lockSection("AE 2320", "AE 2320-CX01");
    state().lockSection("AE 2410", "AE 2410-C01");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    engine.solve.mockClear();
    state().setProfessor("AE 2320", "ye lu");
    expect(state().professorByCourse).toEqual({ "AE 2320": "Ye Lu" });
    expect(state().locks).toEqual({ "AE 2320": ["AE 2320-CL01"], "AE 2410": ["AE 2410-C01"] });
    expect(state().professorNotice).toEqual({ course: "AE 2320", sections: ["CX01"] });
    expect(state().solveStatus).toBe("waiting");
    expect(readDraft(storage, "2027-C")?.professorByCourse).toEqual({ "AE 2320": "Ye Lu" });
    expect(JSON.parse(storage.getItem(draftKey("2027-C"))!)).not.toHaveProperty("professorNotice");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    expect(engine.solve).toHaveBeenCalledOnce();
    expect(engine.solve.mock.calls[0][0].preferences?.anyOf).toEqual({ "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"] });
  });

  it("restores each term's choice, clears it through the diagnosis fix and removes it with the course", async () => {
    const { state, engine } = setup();
    await state().init();
    state().addCourse("AE 2320");
    state().setProfessor("AE 2320", "Ye Lu");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    await state().setTerm("2027-D");
    expect(state().professorByCourse).toEqual({});
    await state().setTerm("2027-C");
    expect(state().professorByCourse).toEqual({ "AE 2320": "Ye Lu" });
    state().applyFix({ kind: "clearAnyOf", course: "AE 2320", schedules: 2, capped: false });
    expect(state().professorByCourse).toEqual({ "AE 2320": null });
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    expect(engine.solve.mock.calls.at(-1)![0].preferences?.anyOf).toEqual({});
    state().removeCourse("AE 2320");
    expect(state().professorByCourse).toEqual({});
  });

  it("ignores unplanned courses, unknown names and repeated selections", async () => {
    const { state, engine } = setup();
    await state().init();
    state().setProfessor("AE 2320", "Ye Lu");
    expect(state().professorByCourse).toEqual({});
    state().addCourse("AE 2320");
    state().setProfessor("AE 2320", "Missing Professor");
    expect(state().professorByCourse).toEqual({});
    state().setProfessor("AE 2320", "Ye Lu");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    engine.solve.mockClear();
    state().setProfessor("AE 2320", "YE LU");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    expect(engine.solve).not.toHaveBeenCalled();
  });
});

describe("openPlan", () => {
  const plan = {
    professorByCourse: { "AE 2320": "Ye Lu" },
    courses: ["AE 2410", "AE 2320"],
    preferences: { startsAfter: 600, blocked: [{ day: "Fri" as const, start: 840, end: 960, label: "Work" }], onlyOpen: false },
    locks: { "AE 2320": ["AE 2320-CX02"] },
    sortPreset: "fewestGaps" as const,
  };
  const chosen = { "AE 2410": ["AE 2410-C01"], "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"] };

  it("switches term, replaces the draft and solves once", async () => {
    const { state, engine, storage } = setup();
    await state().init();
    state().addCourse("AB 1533");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    engine.solve.mockClear();

    const opened = state().openPlan("2027-D", plan, chosen);
    await vi.runAllTimersAsync();
    expect(await opened).toBe(true);
    expect(engine.solve).toHaveBeenCalledTimes(1);
    expect(state()).toMatchObject({ termId: "2027-D", ...plan, selectedCourse: "AE 2410", solveStatus: "done" });
    expect(readDraft(storage, "2027-D")).toMatchObject(plan);
    expect(readDraft(storage, "2027-C")?.courses).toEqual(["AB 1533"]);
  });

  it("shows the saved sections, picking the same-time alternative", async () => {
    const { state } = setup();
    await state().init();
    const opened = state().openPlan("2027-C", plan, chosen);
    await vi.runAllTimersAsync();
    await opened;
    expect(state().scheduleIndex).toBe(0);
    expect(selectChosenSections(state())).toEqual(chosen);
  });

  it("pages to the schedule with the saved sections", async () => {
    const { state, engine } = setup();
    engine.solve.mockImplementation(async (request) => separateLabs(request));
    await state().init();
    const opened = state().openPlan("2027-C", plan, chosen);
    await vi.runAllTimersAsync();
    await opened;
    expect(state().scheduleIndex).toBe(1);
    expect(selectChosenSections(state())).toEqual(chosen);
  });

  it("solves once without the debounce when the term is already open", async () => {
    const { state, engine } = setup();
    await state().init();
    state().addCourse("AB 1533");
    engine.solve.mockClear();
    const opened = state().openPlan("2027-C", { ...plan, courses: ["AE 2320", "ZZ 9999"] });
    await flush();
    expect(await opened).toBe(true);
    await vi.runAllTimersAsync();
    expect(engine.solve).toHaveBeenCalledTimes(1);
    expect(state()).toMatchObject({ courses: ["AE 2320"], selectedCourse: "AE 2320" });
  });

  it("gives up when the term can't load", async () => {
    const { state } = setup();
    const opened = state().openPlan("not a term", plan, chosen);
    await vi.runAllTimersAsync();
    expect(await opened).toBe(false);
    expect(state().termStatus).toBe("error");
  });
});

describe("pickOption", () => {
  async function planned(solve?: (request: SolveRequest) => SolveResponse) {
    const context = setup();
    if (solve) context.engine.solve.mockImplementation(async (request) => solve(request));
    await context.state().init();
    context.state().addCourse("AE 2320");
    context.state().addCourse("AE 2410");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    context.engine.solve.mockClear();
    return context;
  }

  it("picks a same-time option in the shown schedule without solving", async () => {
    const { state, engine } = await planned();
    state().nextSchedule();
    state().pickOption("AE 2320", ["AE 2320-CX01", "AE 2320-CL01"]);
    expect(state().scheduleIndex).toBe(1);
    expect(selectChosenSections(state())["AE 2320"]).toEqual(["AE 2320-CL01", "AE 2320-CX01"]);
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    expect(engine.solve).not.toHaveBeenCalled();
  });

  it("pages to a schedule that has the option and the rest of the shown one", async () => {
    const { state, engine } = await planned(separateLabs);
    state().selectCourse("AE 2320", "AE 2320-CX01");
    state().pickOption("AE 2320", ["AE 2320-CL01", "AE 2320-CX02"]);
    expect(state()).toMatchObject({ scheduleIndex: 1, locks: {}, selectedSection: "AE 2320-CX02" });
    expect(selectChosenSections(state())["AE 2320"]).toEqual(["AE 2320-CL01", "AE 2320-CX02"]);
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    expect(engine.solve).not.toHaveBeenCalled();
  });

  it("locks the option's new section when no schedule has it, in place of a lock it drops", async () => {
    const { state, engine } = await planned((request) => separateLabs(request, 1));
    state().lockSection("AE 2320", "AE 2320-CL01");
    state().lockSection("AE 2320", "AE 2320-CX01");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    engine.solve.mockClear();

    state().pickOption("AE 2320", ["AE 2320-CL01", "AE 2320-CX02"]);
    expect(state().locks).toEqual({ "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"] });
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    expect(engine.solve).toHaveBeenCalledTimes(1);
  });

  it("after locking, shows the schedule that keeps the rest of the shown one", async () => {
    const { state, engine } = await planned((request) => separateLabs(request, 1));
    engine.solve.mockImplementation(async (request) => separateLabs(request, 2));
    state().pickOption("AE 2320", ["AE 2320-CL01", "AE 2320-CX02"]);
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    expect(state().scheduleIndex).toBe(1);
    expect(selectChosenSections(state())["AE 2320"]).toEqual(["AE 2320-CL01", "AE 2320-CX02"]);

    state().setPreferences({ onlyOpen: false });
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    expect(state().scheduleIndex).toBe(0);
  });

  it("ignores the shown option and options the course doesn't have", async () => {
    const { state } = await planned();
    const before = state();
    state().pickOption("AE 2320", ["AE 2320-CL01", "AE 2320-CX01"]);
    state().pickOption("AE 2320", ["AE 2320-CX01", "AE 2320-CX02"]);
    state().pickOption("AB 1533", ["AB 1533-C01"]);
    expect(state()).toBe(before);
  });
});

describe("setScheduleIndex", () => {
  it("shows a schedule by position, kept within the answer", async () => {
    const { state } = setup();
    await state().init();
    state().setScheduleIndex(1);
    expect(state().scheduleIndex).toBe(0);
    state().addCourse("AE 2320");
    await vi.advanceTimersByTimeAsync(SOLVE_DELAY_MS);
    state().setScheduleIndex(1);
    expect(state().scheduleIndex).toBe(1);
    state().setScheduleIndex(9);
    expect(state().scheduleIndex).toBe(1);
    state().setScheduleIndex(-1);
    expect(state().scheduleIndex).toBe(0);
  });
});
