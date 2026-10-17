import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearDataCache, DataLoadError, isTermId, loadTerm, loadTermIndex } from "./load";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  clearDataCache();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadTermIndex", () => {
  it("fetches /data/index.json once and caches it", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ terms: [{ id: "2027-C" }] }));
    const [first, second] = await Promise.all([loadTermIndex(), loadTermIndex()]);
    expect(first.terms[0].id).toBe("2027-C");
    expect(second).toBe(first);
    expect(await loadTermIndex()).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/data/index.json");
  });
});

describe("loadTerm", () => {
  it("fetches the term file by id and caches each term separately", async () => {
    fetchMock.mockImplementation(async (input) => jsonResponse({ term: { id: String(input) } }));
    const c = await loadTerm("2027-C");
    const d = await loadTerm("2027-D");
    expect(await loadTerm("2027-C")).toBe(c);
    expect(c.term.id).toBe("/data/2027-C.json");
    expect(d.term.id).toBe("/data/2027-D.json");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fails with the HTTP status and tries again on the next call", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 404));
    const error = await loadTerm("2026-A").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(DataLoadError);
    expect(error).toMatchObject({ path: "/data/2026-A.json", status: 404 });

    fetchMock.mockResolvedValueOnce(jsonResponse({ term: { id: "2026-A" } }));
    await expect(loadTerm("2026-A")).resolves.toMatchObject({ term: { id: "2026-A" } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("turns network errors and broken JSON into DataLoadError", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(loadTerm("2027-C")).rejects.toMatchObject({ name: "DataLoadError", status: null });

    fetchMock.mockResolvedValueOnce(new Response("{not json", { status: 200 }));
    await expect(loadTerm("2027-C")).rejects.toBeInstanceOf(DataLoadError);
  });

  it("refuses anything that isn't a term id without fetching", async () => {
    await expect(loadTerm("../secrets")).rejects.toBeInstanceOf(DataLoadError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("isTermId", () => {
  it("accepts year-letter ids only", () => {
    expect(isTermId("2027-C")).toBe(true);
    expect(isTermId("2027-c")).toBe(false);
    expect(isTermId("index")).toBe(false);
    expect(isTermId("2027-C.json")).toBe(false);
  });
});
