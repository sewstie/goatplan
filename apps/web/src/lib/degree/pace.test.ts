import { describe, expect, it } from "vitest";
import { estimatePace } from "./pace";

const openTerm = { letter: "C", year: 2027 } as const;

describe("estimatePace", () => {
  it("finishes in A Term 2029 with 28 lines at 3 courses a term", () => {
    expect(estimatePace({ linesToGo: 28, coursesPerTerm: 3, summer: false, openTerm })).toEqual({ finish: { letter: "A", year: 2029 }, terms: 10 });
  });

  it("finishes in B Term 2028 with 28 lines at 4 courses a term", () => {
    expect(estimatePace({ linesToGo: 28, coursesPerTerm: 4, summer: false, openTerm })).toEqual({ finish: { letter: "B", year: 2028 }, terms: 7 });
  });

  it("gets there sooner with summers", () => {
    const summers = estimatePace({ linesToGo: 28, coursesPerTerm: 3, summer: true, openTerm });
    expect(summers.terms).toBeGreaterThan(7);
    expect(summers.finish).not.toEqual({ letter: "A", year: 2029 });
  });

  it("is already there with nothing left", () => {
    expect(estimatePace({ linesToGo: 0, coursesPerTerm: 3, summer: false, openTerm })).toEqual({ finish: openTerm, terms: 0 });
  });
});
