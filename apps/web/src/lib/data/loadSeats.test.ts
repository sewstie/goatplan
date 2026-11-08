import { afterEach, describe, expect, it, vi } from "vitest";
import { loadSeats } from "./loadSeats";

const snapshot = {
  termId: "2027-C", fetchedAt: "2026-11-12T11:55:00.000Z",
  sections: [{ id: "CS 2303-C01", status: "closed", enrolled: 40, capacity: 40, waitlist: { taken: 2, capacity: 10 } }],
};
afterEach(() => vi.unstubAllGlobals());

describe("seat loading", () => {
  it("loads the small same-origin route", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(snapshot)));
    expect(await loadSeats("2027-C")).toEqual(snapshot);
    expect(fetch).toHaveBeenCalledWith("/api/seats?term=2027-C", expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it("never asks for something that isn't a term", async () => {
    vi.stubGlobal("fetch", vi.fn());
    expect(await loadSeats("../secret")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    null,
    { ...snapshot, termId: "2027-D" },
    { ...snapshot, fetchedAt: "yesterday" },
    { ...snapshot, sections: "all" },
    { ...snapshot, sections: [{ ...snapshot.sections[0], enrolled: -1 }] },
    { ...snapshot, sections: [{ ...snapshot.sections[0], status: "maybe" }] },
    { ...snapshot, sections: [{ ...snapshot.sections[0], waitlist: null }] },
  ])("falls back when the answer is malformed: %j", async (data) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(data)));
    expect(await loadSeats("2027-C")).toBeNull();
  });

  it("falls back when the route fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await loadSeats("2027-C")).toBeNull();
    vi.mocked(fetch).mockResolvedValue(new Response("", { status: 503 }));
    expect(await loadSeats("2027-C")).toBeNull();
  });
});
