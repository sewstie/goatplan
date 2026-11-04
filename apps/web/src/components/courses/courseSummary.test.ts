import { describe, expect, it } from "vitest";
import {
  courseCount,
  courseCredits,
  formatCredits,
  rowSections,
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

describe("rowSections", () => {
  const ids = (sections: { id: string }[]) => sections.map((item) => item.id);

  it("takes the current schedule's sections", () => {
    expect(ids(rowSections(ae2320, ["AE 2320-CL01", "AE 2320-CX02"], undefined))).toEqual(["AE 2320-CL01", "AE 2320-CX02"]);
  });

  it("falls back to the only option, then to locked sections", () => {
    expect(ids(rowSections(ae2210, undefined, undefined))).toEqual(["AE 2210-C01"]);
    expect(ids(rowSections(ae2320, [], ["AE 2320-CX03"]))).toEqual(["AE 2320-CX03"]);
    expect(rowSections(ae2320, [], undefined)).toEqual([]);
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
