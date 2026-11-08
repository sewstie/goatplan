// @vitest-environment node
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cacheSettings = vi.hoisted(() => ({ keys: [] as string[], options: {} }));
vi.mock("next/cache", () => ({ unstable_cache: (fn: (...args: unknown[]) => unknown, keys: string[], options: object) => {
  cacheSettings.keys = keys;
  cacheSettings.options = options;
  return fn;
} }));
import { sharedListing, SEAT_SOURCE_URL } from "@/lib/data/seatSource";
import { GET } from "./route";

const raw = JSON.parse(readFileSync(new URL("../../../../../../data/fixtures/sample-sections.json", import.meta.url), "utf8"));
const get = (query: string) => GET(new Request(`https://goatplan.test/api/seats${query}`));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-12T12:00:00Z"));
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(raw)));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("GET /api/seats", () => {
  it("returns only seat fields for one term, cached for 15 minutes", async () => {
    const response = await get("?term=2027-C");
    expect(response.status).toBe(200);
    expect(cacheSettings).toEqual({ keys: ["seats-v2"], options: { revalidate: 900 } });
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=0, s-maxage=900, stale-while-revalidate=900");
    const data = await response.json();
    expect(Object.keys(data).sort()).toEqual(["fetchedAt", "sections", "termId"]);
    expect(data.fetchedAt).toBe("2026-11-12T12:00:00.000Z");
    expect(data.termId).toBe("2027-C");
    expect(data.sections).toHaveLength(5);
    for (const section of data.sections) {
      expect(Object.keys(section).sort()).toEqual(["capacity", "enrolled", "id", "status", "waitlist"]);
    }
    expect(fetch).toHaveBeenCalledWith(SEAT_SOURCE_URL, expect.objectContaining({ cache: "no-store" }));
  });

  it.each(["", "?term=../secret", "?term=2099-Z"])("rejects an absent, invalid or unpublished term: %s", async (query) => {
    const response = await get(query);
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shares one WPI request between visitors and terms while it runs", async () => {
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValue(new Promise<Response>((done) => { resolve = done; }));
    const requests = [get("?term=2027-C"), get("?term=2027-C"), get("?term=2027-D")];
    resolve(Response.json(raw));
    const responses = await Promise.all(requests);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(responses.map((response) => response.status)).toEqual([200, 200, 503]);
  });

  it("asks WPI again once the shared request is over", async () => {
    await get("?term=2027-C");
    await get("?term=2027-C");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each(["http", "network", "schema"])("answers 503 without caching when WPI fails, so the daily file is used: %s", async (failure) => {
    if (failure === "http") vi.mocked(fetch).mockResolvedValue(new Response("", { status: 503 }));
    if (failure === "network") vi.mocked(fetch).mockRejectedValue(new Error("offline"));
    if (failure === "schema") vi.mocked(fetch).mockResolvedValue(Response.json({ broken: [] }));
    const response = await get("?term=2027-C");
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it.each(["http", "network", "schema", "no sections"])("gives the server cache a result even when WPI fails: %s", async (failure) => {
    if (failure === "http") vi.mocked(fetch).mockResolvedValue(new Response("", { status: 503 }));
    if (failure === "network") vi.mocked(fetch).mockRejectedValue(new Error("offline"));
    if (failure === "schema") vi.mocked(fetch).mockResolvedValue(Response.json({ broken: [] }));
    if (failure === "no sections") vi.mocked(fetch).mockResolvedValue(Response.json({ Report_Entry: [{ Course_Title: "nothing" }] }));
    await expect(sharedListing()).resolves.toBeNull();
  });
});
