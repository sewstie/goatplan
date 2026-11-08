import { expect, it } from "vitest";
import { planTerms } from "../planGrid";
import { recommendationTerms, defaultRecommendationTerm } from "./terms";
it("crosses B/C and D/A without summer, clipping the supported range", () => {
  const choices = planTerms(2026);
  expect(recommendationTerms(choices, { letter: "B", year: 2026 }, 4)).toEqual([{ letter: "B", year: 2026 }, { letter: "C", year: 2027 }, { letter: "D", year: 2027 }, { letter: "A", year: 2027 }]);
  expect(recommendationTerms(choices, { letter: "D", year: 2030 }, 4)).toHaveLength(1);
  expect(() => recommendationTerms(choices, { letter: "E", year: 2027 }, 1)).toThrow();
});
it("defaults with New York dates and returns no unsupported future term", () => {
  expect(defaultRecommendationTerm(planTerms(2026), new Date("2026-12-13T03:00:00Z"))).toEqual({ letter: "C", year: 2027 });
  expect(defaultRecommendationTerm(planTerms(2026), new Date("2026-12-14T03:00:00Z"))).toEqual({ letter: "C", year: 2027 });
  expect(defaultRecommendationTerm(planTerms(2026), new Date("2031-11-07T12:00:00Z"))).toBeNull();
});
