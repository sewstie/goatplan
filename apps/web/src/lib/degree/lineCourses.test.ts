import { describe, expect, it } from "vitest";
import type { Course } from "@/lib/data/types";
import { typedCourse } from "./history";
import { coursesForLine, matchesQuery, needsPin } from "./lineCourses";
import { loadSheet } from "./sheets";

const course = (code: string, title = "", level = "Undergraduate"): Course => ({ code, subject: code.split(" ")[0], title, credits: 3, level, description: "", sections: [], options: [] } as unknown as Course);
const catalog = ["MA 1021", "MA 2051", "MA 2071", "MA 3631", "CS 2102", "MA 2621", "MA 4000"].map((code) => course(code));
catalog.push(course("MA 5000", "", "Graduate"));
const MATH_2000 = 38;

describe("courses for a sheet line", () => {
  it("lists only courses that fit the line, leaving out ones already in the history", async () => {
    const sheet = await loadSheet("cs-2030");
    const codes = coursesForLine({ line: MATH_2000, courses: catalog, history: [{ ...typedCourse("MA 2051"), status: "taken" }], sheet, term: null }).map((item) => item.name);
    expect(codes).toEqual(["MA 2071", "MA 2621", "MA 3631", "MA 4000"]);
  });

  it("suggests only courses from the selected CS area, including non-CS social courses", async () => {
    const sheet = await loadSheet("cs-2030");
    const courses = ["CS 2102", "CS 3043", "GOV 2314", "ID 2314", "GOV 2315", "IMGD 2000", "IMGD 2002", "RBE 3100", "CS 3133"].map((code) => course(code));
    const codes = (line: number) => coursesForLine({ line, courses, history: [], sheet, term: null }).map((item) => item.name);
    expect(codes(25)).toEqual(["CS 3043", "GOV 2314", "GOV 2315", "IMGD 2000", "RBE 3100"]);
    expect(codes(23)).toEqual(["CS 3133"]);
    expect(codes(18)).toContain("CS 2102");
    expect(codes(18)).not.toContain("GOV 2314");
  });

  it("lists matching courses regardless of the selected term", async () => {
    const sheet = await loadSheet("cs-2030");
    const codes = coursesForLine({ line: MATH_2000, courses: catalog, history: [], sheet, term: { letter: "C", year: 2027 } }).map((item) => item.name);
    expect(codes).toEqual(["MA 2051", "MA 2071", "MA 2621", "MA 3631", "MA 4000"]);
  });

  it("lists a cross-listed course once, under the name that fits the line", async () => {
    const sheet = await loadSheet("cs-2030");
    const found = coursesForLine({ line: MATH_2000, courses: [course("CS 2022"), course("MA 2201")], history: [], sheet, term: null });
    expect(found.map(({ course: item, name, others }) => [item.code, name, others])).toEqual([["MA 2201", "MA 2201", ["CS 2022"]]]);
    const onlyCs = coursesForLine({ line: MATH_2000, courses: [course("CS 2022")], history: [], sheet, term: null });
    expect(onlyCs.map(({ course: item }) => [item.code, item.subject])).toEqual([["MA 2201", "MA"]]);
  });

  it("combines observed terms across aliases and leaves unknown offerings empty", async () => {
    const sheet = await loadSheet("cs-2030");
    const courses = [{ ...course("GOV 2314"), termLetters: ["D", "A"] }, { ...course("ID 2314"), termLetters: ["C", "A"] }, course("IMGD 2000")];
    const found = coursesForLine({ line: 25, courses, history: [], sheet, term: null });
    expect(found.find((item) => item.name === "GOV 2314")?.terms).toEqual(["A", "C", "D"]);
    expect(found.find((item) => item.name === "IMGD 2000")?.terms).toEqual([]);
  });

  it("leaves out a course an only-one rule keeps off a major line, but not off a free elective", async () => {
    const sheet = await loadSheet("cs-2030");
    const history = [{ ...typedCourse("CS 2102"), status: "taken" as const }];
    const codes = (line: number) => coursesForLine({ line, courses: [course("CS 2103"), course("CS 2303")], history, sheet, term: null }).map((item) => item.name);
    expect(codes(18)).toEqual(["CS 2303"]);
    expect(codes(13)).toEqual(["CS 2103", "CS 2303"]);
  });

  it("sorts lettered codes by their level", async () => {
    const sheet = await loadSheet("cs-2030");
    const codes = coursesForLine({ line: MATH_2000, courses: [course("MA 322X"), course("MA 2051")], history: [], sheet, term: null }).map((item) => item.name);
    expect(codes).toEqual(["MA 2051", "MA 322X"]);
  });

  it("matches a filter by code, code without a space, or title words", () => {
    const item = course("MA 2071", "Matrices and Linear Algebra I");
    expect(matchesQuery(item, "ma2071")).toBe(true);
    expect(matchesQuery(item, "linear matrices")).toBe(true);
    expect(matchesQuery(item, "calculus")).toBe(false);
  });

  it("pins only when the course could also land on a different kind of empty line", async () => {
    const sheet = await loadSheet("cs-2030");
    expect(needsPin("MA 2071", 3, MATH_2000, [34, 35, 38], sheet)).toBe(true);
    expect(needsPin("MA 2071", 3, MATH_2000, [38], sheet)).toBe(false);
    expect(needsPin("CS 2102", 3, 17, [17, 18, 19], sheet)).toBe(false);
    expect(needsPin("CS 3043", 3, 25, [17, 25], sheet)).toBe(true);
    expect(needsPin("GOV 2314", 3, 25, [8, 25], sheet)).toBe(false);
  });
});
