import { beforeEach, expect, it, vi } from "vitest";
import type { TermFile } from "@/lib/data/types";
import { loadRecommendationTerm } from "./loadTerm";

const mocks = vi.hoisted(() => ({ term: vi.fn(), seats: vi.fn() }));
vi.mock("@/lib/data/load", () => ({ loadTerm: mocks.term }));
vi.mock("@/lib/data/loadSeats", () => ({ loadSeats: mocks.seats }));
const section = { id: "CS 1101-C01", status: "open", enrolled: 10, capacity: 20, waitlist: { taken: 0, capacity: 0 } };
const file = { term: { id: "2027-C" }, generatedAt: "2026-11-01T00:00:00Z", courses: [{ code: "CS 1101", sections: [section] }] } as unknown as TermFile;
beforeEach(() => { vi.clearAllMocks(); mocks.term.mockResolvedValue(file); });

it("refreshes seats for recommendations even when the daily file is cached", async () => {
  mocks.seats.mockResolvedValue({ termId: "2027-C", fetchedAt: "2026-11-08T00:00:00Z", sections: [{ ...section, enrolled: 20 }] });
  const result = await loadRecommendationTerm("2027-C");
  expect(result.courses[0].sections[0].enrolled).toBe(20);
  expect(file.courses[0].sections[0].enrolled).toBe(10);
  await loadRecommendationTerm("2027-C");
  expect(mocks.seats).toHaveBeenCalledTimes(2);
});

it("uses the daily seat counts when live seats are unavailable", async () => {
  mocks.seats.mockResolvedValue(null);
  expect(await loadRecommendationTerm("2027-C")).toBe(file);
});
