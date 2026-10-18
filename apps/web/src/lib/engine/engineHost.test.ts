import { describe, expect, it, vi } from "vitest";
import { createEngineHost, type GoatplanModule } from "./engineHost";

function fakeEngine(): GoatplanModule {
  return {
    loadTerm: vi.fn((text: string) => {
      const termId = JSON.parse(text).term?.id;
      return termId
        ? JSON.stringify({ ok: true, version: 1, termId, courses: 2 })
        : JSON.stringify({ ok: false, version: 1, error: { code: "badTerm", message: "Bad term", detail: null } });
    }),
    handle: vi.fn((text: string) => JSON.stringify({ ok: true, echo: JSON.parse(text) })),
  };
}

function setup(options: { fetchTermText?: (termId: string) => Promise<string> } = {}) {
  const engine = fakeEngine();
  const loadModule = vi.fn(async () => engine);
  const fetchTermText = vi.fn(
    options.fetchTermText ?? (async (termId: string) => JSON.stringify({ term: { id: termId } })),
  );
  const host = createEngineHost({ loadModule, fetchTermText });
  return { host, engine, loadModule, fetchTermText };
}

describe("engine host", () => {
  it("loads a term from its file and answers with the engine's response", async () => {
    const { host, engine, fetchTermText } = setup();
    const reply = await host.handle({ id: 1, kind: "loadTerm", termId: "2027-C" });
    expect(reply).toEqual({
      id: 1,
      type: "result",
      response: { ok: true, version: 1, termId: "2027-C", courses: 2 },
    });
    expect(fetchTermText).toHaveBeenCalledWith("2027-C");
    expect(engine.loadTerm).toHaveBeenCalledWith('{"term":{"id":"2027-C"}}');
  });

  it("decodes transferred bytes instead of fetching the file", async () => {
    const { host, engine, fetchTermText } = setup();
    const buffer = new TextEncoder().encode('{"term":{"id":"2027-C"}}').buffer;
    const reply = await host.handle({ id: 1, kind: "loadTerm", termId: "2027-C", buffer });
    expect(reply).toMatchObject({ type: "result", response: { ok: true, termId: "2027-C" } });
    expect(engine.loadTerm).toHaveBeenCalledWith('{"term":{"id":"2027-C"}}');
    expect(fetchTermText).not.toHaveBeenCalled();
  });

  it("starts the engine once and doesn't reload a term that is already loaded", async () => {
    const { host, loadModule, fetchTermText } = setup();
    await host.handle({ id: 1, kind: "loadTerm", termId: "2027-C" });
    await host.handle({ id: 2, kind: "loadTerm", termId: "2027-C" });
    await host.handle({ id: 3, kind: "loadTerm", termId: "2027-D" });
    expect(loadModule).toHaveBeenCalledTimes(1);
    expect(fetchTermText.mock.calls.map(([termId]) => termId)).toEqual(["2027-C", "2027-D"]);
  });

  it("sends solve requests to the engine as JSON text", async () => {
    const { host, engine } = setup();
    const request = { version: 1 as const, courses: ["AE 2320"] };
    const reply = await host.handle({ id: 7, kind: "solve", request });
    expect(engine.handle).toHaveBeenCalledWith(JSON.stringify(request));
    expect(reply).toMatchObject({ id: 7, type: "result", response: { echo: request } });
  });

  it("keeps the previous term when a new one fails to load", async () => {
    const { host, fetchTermText } = setup({
      fetchTermText: async (termId) => (termId === "2027-D" ? "{}" : JSON.stringify({ term: { id: termId } })),
    });
    await host.handle({ id: 1, kind: "loadTerm", termId: "2027-C" });
    const reply = await host.handle({ id: 2, kind: "loadTerm", termId: "2027-D" });
    expect(reply).toMatchObject({ type: "result", response: { ok: false, error: { code: "badTerm" } } });
    await host.handle({ id: 3, kind: "loadTerm", termId: "2027-C" });
    expect(fetchTermText).toHaveBeenCalledTimes(2);
  });

  it("reports fetch problems and bad term ids as fetchFailed", async () => {
    const { host, fetchTermText } = setup({
      fetchTermText: async () => {
        throw new Error("HTTP 404");
      },
    });
    expect(await host.handle({ id: 1, kind: "loadTerm", termId: "2026-A" })).toMatchObject({
      type: "failure",
      reason: "fetchFailed",
      message: expect.stringContaining("HTTP 404"),
    });
    expect(await host.handle({ id: 2, kind: "loadTerm", termId: "../index" })).toMatchObject({
      type: "failure",
      reason: "fetchFailed",
    });
    expect(fetchTermText).toHaveBeenCalledTimes(1);
  });

  it("reports a module that won't start as engineUnavailable, and tries again next time", async () => {
    const engine = fakeEngine();
    const loadModule = vi
      .fn<() => Promise<GoatplanModule>>()
      .mockRejectedValueOnce(new Error("wasm blocked"))
      .mockResolvedValue(engine);
    const host = createEngineHost({ loadModule, fetchTermText: async () => "{}" });

    expect(await host.handle({ id: 1, kind: "solve", request: { version: 1, courses: [] } })).toMatchObject({
      type: "failure",
      reason: "engineUnavailable",
    });
    expect(await host.handle({ id: 2, kind: "solve", request: { version: 1, courses: [] } })).toMatchObject({
      type: "result",
    });
  });

  it("handles messages strictly in order", async () => {
    let releaseFetch!: () => void;
    const fetched = new Promise<void>((resolve) => (releaseFetch = resolve));
    const { host, engine } = setup({
      fetchTermText: async (termId) => {
        await fetched;
        return JSON.stringify({ term: { id: termId } });
      },
    });
    const order: string[] = [];
    const load = host.handle({ id: 1, kind: "loadTerm", termId: "2027-C" }).then(() => order.push("load"));
    const solve = host.handle({ id: 2, kind: "solve", request: { version: 1, courses: [] } }).then(() => order.push("solve"));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(engine.handle).not.toHaveBeenCalled();
    releaseFetch();
    await Promise.all([load, solve]);
    expect(order).toEqual(["load", "solve"]);
  });
});
