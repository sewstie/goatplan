import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TermFile } from "@/lib/data";
import type { SolveRequest, SolveResponse } from "@/lib/engine/types";
import { selectChosenSections } from "@/lib/store";
import { createPlannerStore } from "@/lib/store/createPlannerStore";
import { loaded, MemoryStorage, solved, termFile, termSummary } from "@/lib/store/testing/fixtures";
import { createPlan } from "./createPlan";
import { openPlanInPlanner, settled } from "./openPlan";
import type { SavedPlan } from "./types";

function setup(solve: (request: SolveRequest) => Promise<SolveResponse> = async (request) => solved(request)) {
  const engine = { loadTerm: vi.fn(async (termId: string) => loaded(termId)), solve: vi.fn(solve) };
  const store = createPlannerStore({
    engine,
    loadTermIndex: async () => ({ terms: [termSummary("2027-C"), termSummary("2027-D", "2027-05-05")] }),
    loadTerm: async (termId: string): Promise<TermFile> => termFile(termId),
    takeTermBuffer: () => null,
    storage: new MemoryStorage(),
    now: () => new Date("2026-10-17T12:00:00Z"),
  });
  return { store, engine };
}

/**
 * A plan for 2027-D with AE 2320 lab CX02 locked and a blocked time, saved from a real store. The
 * fake engine ignores locks and shows CX01 first, so CX02 is picked as the same-time alternative.
 */
async function savedPlanForTermD(): Promise<SavedPlan> {
  const { store } = setup();
  await store.getState().setTerm("2027-D");
  store.getState().addCourse("AE 2410");
  store.getState().addCourse("AE 2320");
  store.getState().setPreferences({ startsAfter: 600, blocked: [{ day: "Fri", start: 840, end: 960 }] });
  store.getState().lockSection("AE 2320", "AE 2320-CX02");
  await vi.runAllTimersAsync();
  store.getState().chooseAlternative("AE 2320", ["AE 2320-CL01", "AE 2320-CX02"]);
  return createPlan(store.getState(), { id: "p1", name: "Plan 1", savedAt: new Date() })!;
}

/** Like the fixture engine, but without same-time alternatives, so each lab is its own schedule. */
async function solvedWithoutAlternatives(request: SolveRequest): Promise<SolveResponse> {
  const response = solved(request);
  if (!response.ok) return response;
  for (const schedule of response.schedules) {
    for (const course of schedule.courses) course.alternatives = [course.sections];
  }
  return response;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("openPlanInPlanner", () => {
  it("switches term and replaces the working draft with the plan", async () => {
    const plan = await savedPlanForTermD();
    plan.professorByCourse = { "AE 2320": "Ye Lu", "AE 2410": null };
    const { store, engine } = setup();
    await store.getState().init();
    store.getState().addCourse("AB 1533");
    await vi.runAllTimersAsync();
    engine.solve.mockClear();

    const opened = openPlanInPlanner(store, plan);
    await vi.runAllTimersAsync();
    expect(await opened).toBe(true);
    expect(engine.solve).toHaveBeenCalledTimes(1);

    expect(store.getState()).toMatchObject({
      termId: "2027-D",
      courses: ["AE 2410", "AE 2320"],
      locks: { "AE 2320": ["AE 2320-CX02"] },
      professorByCourse: plan.professorByCourse,
      preferences: { startsAfter: 600, blocked: [{ day: "Fri", start: 840, end: 960 }], onlyOpen: true },
      solveStatus: "done",
    });
    expect(selectChosenSections(store.getState())).toEqual({
      "AE 2410": ["AE 2410-C01"],
      "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"],
    });
    expect(engine.solve.mock.calls[0][0].preferences?.anyOf).toEqual({ "AE 2320": ["AE 2320-CL01"] });
  });

  it("pages to the saved schedule when it isn't the first one", async () => {
    const plan = await savedPlanForTermD();
    const { store } = setup(solvedWithoutAlternatives);
    // The engine lists the CX01 schedule first; the plan took the CX02 one.
    const opened = openPlanInPlanner(store, plan);
    await vi.runAllTimersAsync();
    await opened;
    expect(store.getState().scheduleIndex).toBe(1);
    expect(selectChosenSections(store.getState())["AE 2320"]).toEqual(["AE 2320-CL01", "AE 2320-CX02"]);
  });

  it("leaves out sections the term no longer has", async () => {
    const plan: SavedPlan = { ...(await savedPlanForTermD()), locks: { "AE 2320": ["AE 2320-CX09"] } };
    const { store } = setup();
    const opened = openPlanInPlanner(store, plan);
    await vi.runAllTimersAsync();
    await opened;
    expect(store.getState().locks).toEqual({});
  });

  it("gives up when the plan's term can't load", async () => {
    const plan: SavedPlan = { ...(await savedPlanForTermD()), termId: "not-a-term" };
    const { store } = setup();
    const opened = openPlanInPlanner(store, plan);
    await vi.runAllTimersAsync();
    expect(await opened).toBe(false);
  });
});

describe("settled", () => {
  it("waits for the solve after the latest change, not a late answer to an older one", async () => {
    let answer!: (response: SolveResponse) => void;
    const { store } = setup(
      (request) =>
        new Promise((resolve) => {
          answer = () => resolve(solved(request));
        }),
    );
    await store.getState().setTerm("2027-C");
    store.getState().addCourse("AE 2410");
    await vi.advanceTimersByTimeAsync(250);
    const first = answer;
    store.getState().addCourse("AE 2320");

    let done = false;
    void settled(store).then(() => (done = true));
    first(undefined as never);
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toBe(false);

    await vi.advanceTimersByTimeAsync(250);
    answer(undefined as never);
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toBe(true);
    expect(selectChosenSections(store.getState())).toHaveProperty("AE 2320");
  });

  it("resolves right away when nothing is solving", async () => {
    const { store } = setup();
    await expect(settled(store)).resolves.toBeUndefined();
  });
});
