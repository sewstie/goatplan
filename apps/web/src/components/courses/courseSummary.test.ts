import { describe, expect, it } from "vitest";
import {
  courseCount,
  courseCredits,
  formatCredits,
  rowSections,
  sectionsLine,
  termFieldLabel,
} from "./courseSummary";
import { ae2210, ae2320, course, cs2102, section } from "./testing/courses";

describe("termFieldLabel", () => {
  it("joins the term name, season and year", () => {
    expect(termFieldLabel({ name: "C Term", season: "Spring", year: 2027 })).toBe("C Term · Spring 2027");
  });
});

describe("courseCount", () => {
  it("says course or courses", () => {
    expect(courseCount(1)).toBe("1 course");
    expect(courseCount(3)).toBe("3 courses");
  });
});

describe("rowSections and sectionsLine", () => {
  it("describes the sections on screen: lecture by code, lab by type and code", () => {
    const sections = rowSections(ae2320, ["AE 2320-CL01", "AE 2320-CX02"], undefined);
    expect(sectionsLine(sections)).toBe("CL01 · Lab CX02");
  });

  it("falls back to the only option, then to locked sections", () => {
    expect(sectionsLine(rowSections(ae2210, undefined, undefined))).toBe("C01");
    expect(sectionsLine(rowSections(ae2320, [], ["AE 2320-CX03"]))).toBe("Lab CX03");
    expect(sectionsLine(rowSections(ae2320, [], undefined))).toBe("");
  });

  it("says when the instructor is still pending", () => {
    const pending = course("AE 5231", "Air Breathing Propulsion", [section("AE 5231", "C02")]);
    expect(sectionsLine(rowSections(pending, ["AE 5231-C02"], undefined))).toBe("C02 · Instructor pending");
  });

  it("doesn't call a lab's instructor pending, since lab instructors aren't shown", () => {
    const labOnly = course("BB 3840", "Lab Techniques", [section("BB 3840", "X01", { type: "lab", instructors: [] })]);
    expect(sectionsLine(rowSections(labOnly, ["BB 3840-X01"], undefined))).toBe("Lab X01");
  });
});

describe("credits", () => {
  it("uses the course's credits unless a section has its own", () => {
    expect(courseCredits(cs2102, cs2102.sections)).toBe(3);
    const ensemble = course("MU 2401", "Orchestra", [section("MU 2401", "D01", { credits: 0 })]);
    expect(courseCredits(ensemble, ensemble.sections)).toBe(0);
    expect(courseCredits({ credits: null }, [])).toBeNull();
  });

  it("formats totals in plain words", () => {
    expect(formatCredits(9)).toBe("9 credits");
    expect(formatCredits(1)).toBe("1 credit");
    expect(formatCredits(0.75 + 3)).toBe("3.75 credits");
    expect(formatCredits(0.1 + 0.2)).toBe("0.3 credits");
  });
});
