import { describe, expect, it } from "vitest";
import type { Course, TermFile } from "@/lib/data/types";
import { buildSearchIndex, searchCourses } from "@/components/courses/searchCourses";
import { firstOffered, offeredCodes, offerHint, termOffers, withTermSections } from "./termOfferings";

const file = (id: string, courses: Record<string, number>): TermFile => ({
  term: { id, name: "", season: "", year: Number(id.slice(0, 4)), start: "", end: "" },
  generatedAt: "",
  courses: Object.entries(courses).map(([code, sections]) => ({ code, sections: Array(sections).fill({}) })),
} as unknown as TermFile);

const offered = offeredCodes([file("2026-B", { "CS 2102": 2, "MA 2071": 0 }), file("2027-C", { "MA 2071": 1 }), file("2027-D", { "CS 2102": 1 })]);

describe("term offerings", () => {
  it("marks each published term, and a course with no sections isn't offered", () => {
    expect(termOffers("CS 2102", offered)).toEqual(new Map([["2026-B", "offered"], ["2027-C", "not-offered"], ["2027-D", "offered"]]));
    expect(termOffers("MA 2071", offered).get("2026-B")).toBe("not-offered");
  });

  it("names the chosen term and the published terms that do offer it", () => {
    const offers = termOffers("CS 2102", offered);
    expect(offerHint("CS 2102", "B Term 2026", offers)).toEqual({ text: "CS 2102 is offered in B Term 2026.", offered: true });
    expect(offerHint("CS 2102", "C Term 2027", offers)).toEqual({ text: "CS 2102 isn’t offered in C Term 2027. It’s offered in B Term 2026 and D Term 2027.", offered: false });
    expect(offerHint("PH 1110", "C Term 2027", termOffers("PH 1110", offered))).toEqual({ text: "PH 1110 isn’t offered in C Term 2027.", offered: false });
  });

  it("says nothing for a term without a published schedule or with no term", () => {
    const offers = termOffers("CS 2102", offered);
    expect(offerHint("CS 2102", "A Term 2027", offers)).toBeNull();
    expect(offerHint("CS 2102", "", offers)).toBeNull();
    expect(offerHint("CS 2102", "B Term 2026", undefined)).toBeNull();
  });

  it("starts on the first term from the next one that offers the course", () => {
    const next = { letter: "C" as const, year: 2027 };
    expect(firstOffered(next, termOffers("CS 2102", offered))).toEqual({ letter: "D", year: 2027 });
    expect(firstOffered(next, termOffers("MA 2071", offered))).toEqual(next);
    expect(firstOffered(next, termOffers("PH 1110", offered))).toEqual(next);
    expect(firstOffered(next, undefined)).toEqual(next);
  });
});

describe("withTermSections", () => {
  const lecture = (id: string, name: string) => ({ id, code: id.split("-")[1], type: "lecture", instructors: [name], meetings: [] });
  const files = [
    { courses: [{ code: "CS 2102", sections: [lecture("CS 2102-BL01", "Kathi Fisler")] }] },
    { courses: [{ code: "CS 2102", sections: [lecture("CS 2102-DL01", "Jane Doe")] }] },
  ] as unknown as TermFile[];
  const catalog = [{ code: "CS 2102", subject: "CS", title: "Object-Oriented Design Concepts", sections: [] }, { code: "MA 1021", subject: "MA", title: "Calculus I", sections: [] }] as unknown as Course[];

  it("gives catalog courses the sections of every published term", () => {
    const [cs, ma] = withTermSections(catalog, files);
    expect(cs.sections.map((section) => section.id)).toEqual(["CS 2102-BL01", "CS 2102-DL01"]);
    expect(ma).toBe(catalog[1]);
  });

  it("lets the degree search find a course by a professor who teaches it this year", () => {
    const index = buildSearchIndex(withTermSections(catalog, files));
    expect(searchCourses(index, "fisler").map((result) => result.course.code)).toEqual(["CS 2102"]);
    expect(searchCourses(index, "jane doe").map((result) => result.course.code)).toEqual(["CS 2102"]);
    expect(searchCourses(buildSearchIndex(catalog), "fisler")).toEqual([]);
  });
});
