import { describe, expect, it } from "vitest";
import { compactCode, normalizeCourseCode } from "./courseCode";

describe("normalizeCourseCode", () => {
  it.each([
    ["cs2102", "CS 2102"],
    ["CS2102", "CS 2102"],
    ["cs 2102", "CS 2102"],
    ["  Cs   2102 ", "CS 2102"],
    ["CS-2102", "CS 2102"],
    ["cs_2102", "CS 2102"],
    ["bb402x", "BB 402X"],
    ["arch500", "ARCH 500"],
  ])("reads %j as %j", (text, code) => {
    expect(normalizeCourseCode(text)).toBe(code);
  });

  it.each(["", "cs", "2102", "c 2102", "cs 21", "AE 23200", "computer science", "cs 2102 lab"])(
    "returns null for %j",
    (text) => {
      expect(normalizeCourseCode(text)).toBeNull();
    },
  );
});

describe("compactCode", () => {
  it("keeps only lowercase letters and digits", () => {
    expect(compactCode("CS 2102")).toBe("cs2102");
    expect(compactCode(" cs-21 ")).toBe("cs21");
  });
});
