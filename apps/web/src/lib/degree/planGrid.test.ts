import { describe, expect, it } from "vitest";
import { coursePlanState, coursesInTerm, moveCourseTerm, defaultAddTerm, planTerms, planYears, stateForTerm, statusOfState } from "./planGrid";
import { typedCourse } from "./history";

describe("four-year plan", () => {
  it("places winter and summer in the following calendar year", () => {
    const years = planYears(2026);
    expect(years).toHaveLength(4);
    expect(years[0].terms).toEqual([{ letter: "A", year: 2026 }, { letter: "B", year: 2026 }, { letter: "C", year: 2027 }, { letter: "D", year: 2027 }, { letter: "E", year: 2027 }]);
    expect(years[3].terms[3]).toEqual({ letter: "D", year: 2030 });
  });
  it("moves one course without changing its status, credits or pins", () => {
    const history = { courses: [{ ...typedCourse("CS 2303"), status: "planned" as const, term: "C Term 2027" }, typedCourse("MA 1021")], manual: ["iqp-1"], pins: [{ code: "CS 2303", line: 19 }] };
    const moved = moveCourseTerm(history, "CS 2303", { letter: "D", year: 2027 });
    expect(coursesInTerm(moved, { letter: "C", year: 2027 })).toEqual([]);
    expect(coursesInTerm(moved, { letter: "D", year: 2027 })[0]).toMatchObject({ code: "CS 2303", status: "planned", credits: 3 });
    expect(moved.pins).toEqual(history.pins);
    expect(history.courses[0].term).toBe("C Term 2027");
  });
  it("distinguishes taken, current and future planned courses", () => {
    const course = { ...typedCourse("CS 2102"), term: "B Term 2026" };
    const current = { letter: "B" as const, year: 2026 };
    expect(coursePlanState(course, current)).toBe("taken");
    expect(coursePlanState({ ...course, status: "planned" }, current)).toBe("progress");
    expect(coursePlanState({ ...course, status: "planned", term: "C Term 2027" }, current)).toBe("planned");
  });
  it("reads the status from the term: past is taken, now is in progress, later is planned", () => {
    const current = { letter: "B" as const, year: 2026 };
    expect(stateForTerm({ letter: "A", year: 2026 }, current)).toBe("taken");
    expect(stateForTerm(current, current)).toBe("progress");
    expect(stateForTerm({ letter: "E", year: 2027 }, current)).toBe("planned");
    expect(stateForTerm(null, current)).toBe("taken");
    expect(statusOfState("progress")).toBe("planned");
    expect(statusOfState("taken")).toBe("taken");
  });
  it("lists the plan's terms in school order, summer included, ending at D of the last year", () => {
    const terms = planTerms(2026).map((term) => `${term.letter}${term.year}`);
    expect(terms.slice(0, 6)).toEqual(["A2026", "B2026", "C2027", "D2027", "E2027", "A2027"]);
    expect(terms).toHaveLength(19);
    expect(terms.at(-1)).toBe("D2030");
    expect(terms).not.toContain("C2026");
  });
  it("suggests the last finished term for new courses", () => {
    const name = (term: { letter: string; year: number }) => `${term.letter}${term.year}`;
    expect(name(defaultAddTerm(2026, { letter: "B", year: 2026 }))).toBe("A2026");
    expect(name(defaultAddTerm(2026, { letter: "A", year: 2026 }))).toBe("A2026");
    expect(name(defaultAddTerm(2026, { letter: "E", year: 2027 }))).toBe("D2027");
    expect(name(defaultAddTerm(2026, { letter: "C", year: 2027 }))).toBe("B2026");
    expect(name(defaultAddTerm(2027, { letter: "B", year: 2026 }))).toBe("A2027");
    expect(name(defaultAddTerm(2026, { letter: "A", year: 2031 }))).toBe("D2030");
  });
});
