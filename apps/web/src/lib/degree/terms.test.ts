import { describe, expect, it } from "vitest";
import { compareTerms, nextTerm, parseTerm, PRIOR_CREDIT, termLong, termShort, termsBetween } from "./terms";

describe("parseTerm", () => {
  it.each(["A Term 2026", "A 2026", "A26", "a term 26", "2026-A", "A-2026"])("reads %s", (text) => {
    expect(parseTerm(text)).toEqual({ letter: "A", year: 2026 });
  });

  it.each([undefined, "", PRIOR_CREDIT, "Fall 2026", "Z 2026"])("doesn't read %s", (text) => {
    expect(parseTerm(text)).toBeNull();
  });

  it("names terms", () => {
    expect(termShort({ letter: "C", year: 2027 })).toBe("C27");
    expect(termLong({ letter: "C", year: 2027 })).toBe("C Term 2027");
  });
});

describe("term order", () => {
  it("puts B 2026 before C 2027 and D 2027 before A 2027", () => {
    expect(compareTerms({ letter: "B", year: 2026 }, { letter: "C", year: 2027 })).toBeLessThan(0);
    expect(compareTerms({ letter: "D", year: 2027 }, { letter: "A", year: 2027 })).toBeLessThan(0);
  });

  it("walks through the academic year", () => {
    expect(nextTerm({ letter: "B", year: 2026 })).toEqual({ letter: "C", year: 2027 });
    expect(nextTerm({ letter: "D", year: 2027 })).toEqual({ letter: "A", year: 2027 });
    expect(nextTerm({ letter: "D", year: 2027 }, true)).toEqual({ letter: "E", year: 2027 });
  });

  it("lists the terms in between", () => {
    expect(termsBetween({ letter: "A", year: 2026 }, { letter: "D", year: 2027 }).map(termShort)).toEqual(["A26", "B26", "C27", "D27"]);
  });
});
