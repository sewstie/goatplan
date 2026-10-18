// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearDataCache, loadTerm, loadTermIndex, takeTermBuffer } from "@/lib/data/load";
import { EngineClient, type EngineWorker } from "@/lib/engine/EngineClient";
import { createEngineHost, type GoatplanModule } from "@/lib/engine/engineHost";
import type { WorkerReply, WorkerRequest } from "@/lib/engine/protocol";
import { createPlannerStore } from "./createPlannerStore";
import { solved, termFile, termSummary } from "./testing/fixtures";

// The real data loader, EngineClient and worker logic together; only fetch and the WebAssembly module are fakes.

/** Runs the worker's logic in this thread, moving transferred buffers the way postMessage does. */
class InProcessWorker implements EngineWorker {
  onmessage: EngineWorker["onmessage"] = null;
  onerror: EngineWorker["onerror"] = null;

  constructor(private readonly host: ReturnType<typeof createEngineHost>) {}

  postMessage(message: WorkerRequest, transfer: Transferable[] = []) {
    const received = structuredClone(message, { transfer });
    void this.host.handle(received).then((reply) => this.onmessage?.({ data: reply } as MessageEvent<WorkerReply>));
  }

  terminate() {}
}

const files: Record<string, string> = {
  "/data/index.json": JSON.stringify({ terms: [termSummary("2027-C"), termSummary("2027-D", "2027-05-05")] }),
  "/data/2027-C.json": JSON.stringify(termFile("2027-C")),
  "/data/2027-D.json": JSON.stringify(termFile("2027-D")),
};

const fetchMock = vi.fn(async (input: string | URL | Request) => {
  const body = files[String(input)];
  return body ? new Response(body) : new Response("", { status: 404 });
});

function requestsFor(path: string): number {
  return fetchMock.mock.calls.filter(([input]) => String(input) === path).length;
}

function setup() {
  const engineModule: GoatplanModule = {
    loadTerm: vi.fn((text: string) =>
      JSON.stringify({ ok: true, version: 1, termId: JSON.parse(text).term.id, courses: 3 }),
    ),
    handle: vi.fn((text: string) => JSON.stringify(solved(JSON.parse(text)))),
  };
  const host = createEngineHost({
    loadModule: async () => engineModule,
    fetchTermText: async (termId) => (await fetchMock(`/data/${termId}.json`)).text(),
  });
  const takeBuffer = vi.fn(takeTermBuffer);
  const store = createPlannerStore({
    engine: new EngineClient(() => new InProcessWorker(host)),
    loadTermIndex,
    loadTerm,
    takeTermBuffer: takeBuffer,
    storage: null,
    now: () => new Date("2026-10-17T12:00:00Z"),
  });
  return { store, engineModule, takeBuffer };
}

beforeEach(() => {
  clearDataCache();
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
});

describe("loading a term", () => {
  it("makes exactly one network request for the term file", async () => {
    const { store, engineModule } = setup();
    await store.getState().init();

    expect(store.getState().termStatus).toBe("ready");
    expect(requestsFor("/data/2027-C.json")).toBe(1);
    expect(engineModule.loadTerm).toHaveBeenCalledWith(files["/data/2027-C.json"]);
  });

  it("moves the bytes to the worker instead of copying them", async () => {
    const { store, takeBuffer } = setup();
    await store.getState().init();

    const handedOver = takeBuffer.mock.results[0].value as ArrayBuffer;
    expect(handedOver).toBeInstanceOf(ArrayBuffer);
    expect(handedOver.byteLength).toBe(0);
  });

  it("lets the worker fetch a term itself only when switching back to it", async () => {
    const { store } = setup();
    await store.getState().init();
    await store.getState().setTerm("2027-D");
    expect(requestsFor("/data/2027-D.json")).toBe(1);

    await store.getState().setTerm("2027-C");
    expect(store.getState().termStatus).toBe("ready");
    expect(requestsFor("/data/2027-C.json")).toBe(2);
  });
});
