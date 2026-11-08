// @vitest-environment node
import { pathToFileURL, fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EngineClient, type EngineWorker } from "@/lib/engine/EngineClient";
import { createEngineHost, type GoatplanModule } from "@/lib/engine/engineHost";
import type { WorkerReply, WorkerRequest } from "@/lib/engine/protocol";
import type { SeatSnapshot } from "@/lib/data/seatParser";
import { seatMergeBytes } from "@/lib/data/seatMerge";
import { meetsRules } from "@/lib/data/fit";
import { createPlannerStore } from "./createPlannerStore";
import { termFile, termSummary } from "./testing/fixtures";
import { selectSchedules } from "./selectors";
import { selectViewedSchedule } from "./viewSelectors";
import { designPlan } from "@/lib/plans/testing";
import { buildSharedPlan } from "@/lib/share/buildSharedPlan";
import { plan as sharedPlan } from "@/lib/share/testing";

class InProcessWorker implements EngineWorker {
  onmessage: EngineWorker["onmessage"] = null;
  onerror: EngineWorker["onerror"] = null;
  constructor(private host: ReturnType<typeof createEngineHost>) {}
  postMessage(message: WorkerRequest, transfer: Transferable[] = []) {
    const received = structuredClone(message, { transfer });
    void this.host.handle(received).then((reply) => this.onmessage?.({ data: reply } as MessageEvent<WorkerReply>));
  }
  terminate() {}
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

const snapshot: SeatSnapshot = {
  termId: "2027-C", fetchedAt: "2026-11-12T12:00:00Z",
  sections: [{ id: "AE 2410-C01", status: "closed", enrolled: 40, capacity: 40, waitlist: { taken: 2, capacity: 10 } }],
};

async function setup() {
  const url = pathToFileURL(fileURLToPath(new URL("../../../public/engine/goatplan.mjs", import.meta.url))).href;
  const wasm = await import(/* @vite-ignore */ url);
  const engineModule: GoatplanModule = await wasm.default();
  const host = createEngineHost({ loadModule: async () => engineModule, fetchTermText: async (id) => JSON.stringify(termFile(id)) });
  const engine = new EngineClient(() => new InProcessWorker(host));
  const load = vi.spyOn(engine, "loadTerm");
  const solve = vi.spyOn(engine, "solve");
  const seats = deferred<SeatSnapshot | null>();
  const loadSeats = vi.fn(() => seats.promise);
  const store = createPlannerStore({ engine, loadTermIndex: async () => ({ terms: [termSummary("2027-C"), termSummary("2027-D")] }), loadTerm: async (id) => termFile(id), takeTermBuffer: (id) => seatMergeBytes(termFile(id)), loadSeats, storage: null, now: () => new Date("2026-11-12T12:00:00Z") });
  await store.getState().openPlan("2027-C", { courses: ["AE 2410"], preferences: { startsAfter: 0, blocked: [], onlyOpen: true }, locks: {}, professorByCourse: {}, sortPreset: "bestOverall" });
  return { store, load, solve, seats, loadSeats, engine };
}

afterEach(() => vi.restoreAllMocks());

describe("seat refresh", () => {
  it.each(["saved", "shared"])("leaves a %s view as it was saved while the term gets live seats", async (view) => {
    const { store, seats } = await setup();
    const plan = designPlan();
    const original = structuredClone(plan);
    store.getState().setSavedPlans([plan]);
    if (view === "shared") store.getState().showTemporaryPlan({ ...sharedPlan, view: plan });
    else store.getState().showSaved(plan.id);
    seats.resolve(snapshot);
    await store.getState().refreshSeats();
    expect(selectViewedSchedule(store.getState())).toBe(plan.schedule);
    expect(plan).toEqual(original);
    expect(store.getState().term!.courses.find((course) => course.code === "AE 2410")!.sections[0]).toMatchObject(snapshot.sections[0]);
  });

  it("keeps another term's shared seats unchanged when the draft term refreshes", async () => {
    const { store, seats } = await setup();
    const shared = buildSharedPlan({ ...sharedPlan, termId: "2027-D" }, termFile("2027-D"));
    store.getState().showTemporaryPlan(shared);
    seats.resolve(snapshot);
    await store.getState().refreshSeats();
    expect(selectViewedSchedule(store.getState())).toBe(shared.view.schedule);
    expect(store.getState().term!.courses.find((course) => course.code === "AE 2410")!.sections[0]).toMatchObject(snapshot.sections[0]);
  });

  it("keeps an empty plan idle after updating its seat data", async () => {
    const { store, seats } = await setup();
    store.getState().removeCourse("AE 2410");
    seats.resolve(snapshot);
    await store.getState().refreshSeats();
    expect(store.getState().solveStatus).toBe("idle");
    expect(store.getState().response).toBeNull();
  });

  it("reloads once and solves once after late seats, removing a closed section from open-only schedules", async () => {
    const { store, load, solve, seats } = await setup();
    expect(selectSchedules(store.getState())).toHaveLength(1);
    load.mockClear(); solve.mockClear();
    seats.resolve(snapshot);
    await store.getState().refreshSeats();
    expect(load).toHaveBeenCalledTimes(1);
    expect(solve).toHaveBeenCalledTimes(1);
    expect(selectSchedules(store.getState())).toEqual([]);
    const section = store.getState().term!.courses.find((course) => course.code === "AE 2410")!.sections[0];
    expect(section).toMatchObject(snapshot.sections[0]);
    expect(meetsRules([section], store.getState().preferences)).toBe(false);
    expect(store.getState().seatsUpdatedAt).toBe(snapshot.fetchedAt);
  });

  it("does not reload or solve again for the same cached snapshot", async () => {
    const { store, load, solve, seats } = await setup();
    seats.resolve(snapshot);
    await store.getState().refreshSeats();
    load.mockClear(); solve.mockClear();
    await store.getState().refreshSeats();
    expect(load).not.toHaveBeenCalled();
    expect(solve).not.toHaveBeenCalled();
  });

  it("falls back to the original term and older timestamp when a later refresh fails", async () => {
    const { store, load, solve, seats, loadSeats } = await setup();
    seats.resolve(snapshot);
    await store.getState().refreshSeats();
    loadSeats.mockRejectedValueOnce(new Error("offline"));
    load.mockClear(); solve.mockClear();
    await store.getState().refreshSeats();
    expect(store.getState().term).toEqual(termFile("2027-C"));
    expect(store.getState().seatsUpdatedAt).toBe(termFile("2027-C").generatedAt);
    expect(selectSchedules(store.getState())).toHaveLength(1);
    expect(load).toHaveBeenCalledTimes(1);
    expect(solve).toHaveBeenCalledTimes(1);
  });

  it("keeps the term usable when the first refresh fails or knows no sections", async () => {
    const { store, load, solve, seats, loadSeats } = await setup();
    seats.resolve(null);
    load.mockClear(); solve.mockClear();
    await store.getState().refreshSeats();
    loadSeats.mockResolvedValueOnce({ ...snapshot, sections: [{ ...snapshot.sections[0], id: "UNKNOWN" }] });
    await store.getState().refreshSeats();
    expect(store.getState().term).toEqual(termFile("2027-C"));
    expect(store.getState().seatsUpdatedAt).toBe(termFile("2027-C").generatedAt);
    expect(load).not.toHaveBeenCalled();
    expect(solve).not.toHaveBeenCalled();
  });

  it("ignores a seat response from a term that was left", async () => {
    const { store, seats, loadSeats, load } = await setup();
    loadSeats.mockResolvedValueOnce(null);
    await store.getState().setTerm("2027-D");
    const count = load.mock.calls.length;
    seats.resolve(snapshot);
    await store.getState().refreshSeats();
    expect(store.getState().term?.term.id).toBe("2027-D");
    expect(load).toHaveBeenCalledTimes(count);
  });

  it("reloads merged bytes if the worker loses its term", async () => {
    const { store, seats, solve, load } = await setup();
    seats.resolve(snapshot);
    await store.getState().refreshSeats();
    solve.mockResolvedValueOnce({ ok: false, version: 1, error: { code: "noTerm", message: "Load a term first.", detail: null } });
    load.mockClear();
    await store.getState().openPlan("2027-C", { courses: ["AE 2410"], preferences: { startsAfter: 0, blocked: [], onlyOpen: true }, locks: {}, professorByCourse: {}, sortPreset: "bestOverall" });
    expect(selectSchedules(store.getState())).toEqual([]);
    expect(load).toHaveBeenCalledWith("2027-C", expect.any(ArrayBuffer));
  });
});
