import { describe, expect, it } from "vitest";
import { estimatePace, termLoad } from "./pace";

const openTerm = { letter: "C", year: 2027 } as const;

describe("estimatePace", () => {
  it("splits a semester into its two terms, three courses first", () => {
    expect([5, 6, 7].map((load) => [termLoad("A", load), termLoad("B", load)])).toEqual([[3, 2], [3, 3], [3, 4]]);
    expect(termLoad("E", 7)).toBe(2);
  });

  it("finishes in A Term 2029 with 28 lines at 18 credits a semester", () => {
    expect(estimatePace({ linesToGo: 28, coursesPerSemester: 6, summer: false, openTerm })).toEqual({ finish: { letter: "A", year: 2029 }, terms: 10 });
  });

  it("finishes a semester sooner at 21 credits and later at 15", () => {
    expect(estimatePace({ linesToGo: 28, coursesPerSemester: 7, summer: false, openTerm })).toEqual({ finish: { letter: "C", year: 2029 }, terms: 8 });
    expect(estimatePace({ linesToGo: 28, coursesPerSemester: 5, summer: false, openTerm })).toEqual({ finish: { letter: "C", year: 2030 }, terms: 12 });
  });

  it("gets there sooner with summers", () => {
    const summers = estimatePace({ linesToGo: 28, coursesPerSemester: 6, summer: true, openTerm });
    expect(summers.finish).not.toEqual({ letter: "A", year: 2029 });
  });

  it("is already there with nothing left", () => {
    expect(estimatePace({ linesToGo: 0, coursesPerSemester: 6, summer: false, openTerm })).toEqual({ finish: openTerm, terms: 0 });
  });
});
