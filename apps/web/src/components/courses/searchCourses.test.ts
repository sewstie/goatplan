import { describe, expect, it } from "vitest";
import { buildSearchIndex, SEARCH_RANK, searchCourses, suggestCourseCode } from "./searchCourses";
import { allCourses } from "./testing/courses";

const index = buildSearchIndex(allCourses);
const codes = (query: string) => searchCourses(index, query).map((result) => result.course.code);

describe("searchCourses", () => {
  it("finds a code typed without the space", () => {
    expect(codes("cs2102")[0]).toBe("CS 2102");
    expect(codes("CS 2102")[0]).toBe("CS 2102");
    expect(codes("cs-2102")[0]).toBe("CS 2102");
  });

  it("ranks the exact code above other codes that start the same way", () => {
    expect(codes("cs 2102")).toEqual(["CS 2102"]);
    expect(codes("cs21")).toEqual(["CS 2102", "CS 2103"]);
  });

  it("lists every course of a subject for a subject alone, undergraduate first", () => {
    expect(codes("cs")).toEqual(["CS 2102", "CS 2103", "CS 3013", "CS 502"]);
  });

  it("finds a course by its number alone", () => {
    expect(codes("2320")).toEqual(["AE 2320"]);
  });

  it("finds titles by the start of their words, in any order", () => {
    expect(codes("orbital")).toEqual(["AE 2320"]);
    expect(codes("mech orb")).toEqual(["AE 2320"]);
    expect(codes("ORBITAL MECHANICS")).toEqual(["AE 2320"]);
  });

  it("ranks titles that start with the query above titles that only contain its words", () => {
    const results = searchCourses(index, "object-oriented design");
    expect(results.map((result) => result.course.code)).toEqual(["CS 2102", "CS 2103"]);
    expect(results.map((result) => result.rank)).toEqual([SEARCH_RANK.titleStart, SEARCH_RANK.titleWords]);
  });

  it("finds instructors by first name, last name or both", () => {
    expect(codes("olinger")).toEqual(["AE 2210"]);
    expect(codes("david olinger")).toEqual(["AE 2210"]);
    expect(codes("ye lu")).toEqual(["AE 2320"]);
  });

  it("ignores accents and case in names", () => {
    expect(codes("jose pena")).toEqual(["HU 3900"]);
  });

  it("searches section topic titles", () => {
    expect(codes("early american")).toEqual(["HU 3900"]);
  });

  it("ranks code matches above title matches above instructor matches", () => {
    const results = searchCourses(index, "operating");
    expect(results.map((result) => result.course.code)).toEqual(["CS 3013", "CS 502"]);

    // "Shue" teaches both Operating Systems courses; the subject still decides the order of equal ranks.
    expect(codes("shue")).toEqual(["CS 3013", "CS 502"]);
  });

  it("mixes fields when each word matches something", () => {
    expect(codes("ae orbital")).toEqual(["AE 2320"]);
    expect(searchCourses(index, "ae orbital")[0].rank).toBe(SEARCH_RANK.anyField);
  });

  it("doesn't match a code's number against another course's title", () => {
    const withAesthetics = buildSearchIndex([
      ...allCourses,
      { ...allCourses[0], code: "AR 2750", subject: "AR", title: "Topics in Aesthetics" },
    ]);
    expect(searchCourses(withAesthetics, "ae 2").map((result) => result.course.code)).toEqual([
      "AE 2210",
      "AE 2320",
      "AE 2410",
    ]);
  });

  it("returns nothing for an empty query or a typo in a code", () => {
    expect(codes("")).toEqual([]);
    expect(codes("   ")).toEqual([]);
    expect(codes("AE 23200")).toEqual([]);
  });
});

describe("suggestCourseCode", () => {
  it("suggests the closest code in the typed subject", () => {
    expect(suggestCourseCode("AE 23200", allCourses)).toBe("AE 2320");
    expect(suggestCourseCode("cs 2109", allCourses)).toBe("CS 2102");
  });

  it("falls back to the first course when the subject is unknown", () => {
    expect(suggestCourseCode("professor smith", allCourses)).toBe("AB 1533");
  });

  it("has nothing to suggest without courses", () => {
    expect(suggestCourseCode("AE 2320", [])).toBeNull();
  });
});
