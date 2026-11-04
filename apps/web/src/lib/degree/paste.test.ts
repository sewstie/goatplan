import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parsePastedCodes, parsePastedCourses } from "./paste";

const WORKDAY_SAMPLE = `Academic Record   Fall 2025 - Spring 2026
Student ID 12345678   GPA 3.72   Printed 10/29/2026 at 3:15 PM

Course\tPeriod\tGrade\tCredits
CS 1101 - Introduction to Program Design\t2025 Fall A Term (08/21/2025-10/10/2025)\tA\t3.00
MA 1021-AL01 - Calculus I\tA Term 2025\tB\t3.00
cs2102   Object-Oriented Design Concepts\tB Term 2025\tA\t3.00
MA 1022 Calculus II\t10-Jan-2026\tNR\t3.00
PH-1110 Physics   Sep 2025   NR 2025   3.00
CS 1101 - Introduction to Program Design (repeat)\tD Term 2026\tW\t0.00
wr  1011\tC Term 2026\tTR 2024\t3.00
AREN 402X Topics\t  3.00
`;

describe("parsePastedCodes", () => {
  it("keeps only the codes from a messy transcript, each once, in the order they appear", () => {
    expect(parsePastedCodes(WORKDAY_SAMPLE)).toEqual(["CS 1101", "MA 1021", "CS 2102", "MA 1022", "PH 1110", "WR 1011", "AREN 402X"]);
  });

  it("returns only codes, so no grade, date or title can come along", () => {
    const found = parsePastedCodes(WORKDAY_SAMPLE).join(" ");
    for (const detail of ["Calculus", "3.72", "12345678", "NR", "Term", "2025", "A01", "TR"]) expect(found).not.toContain(detail);
  });

  it.each([
    ["two spaces", "CS  2102"],
    ["a tab", "CS\t2102"],
    ["a non-breaking space", "CS 2102"],
    ["no space", "CS2102"],
    ["lower case", "cs 2102"],
    ["a dash", "CS-2102"],
    ["a long dash", "CS – 2102"],
    ["a dot", "CS.2102"],
    ["brackets around it", "(CS 2102)"],
    ["a comma after it", "CS 2102,"],
    ["a section after it", "CS 2102-BL01"],
    ["a grade before it", "A  CS 2102"],
  ])("reads a code with %s", (_name, text) => {
    expect(parsePastedCodes(text)).toEqual(["CS 2102"]);
  });

  it("treats the same course with different spacing as a duplicate", () => {
    expect(parsePastedCodes("CS 2102 cs2102 CS-2102 cs  2102")).toEqual(["CS 2102"]);
  });

  it("doesn't join a code across lines", () => {
    expect(parsePastedCodes("Grade: NR\n2025 Fall")).toEqual([]);
  });

  it.each([
    "Fall 2025",
    "FALL2025",
    "Sum 2026",
    "Jan 2025",
    "10-Mar-2026",
    "Term 2025",
    "Year 2026",
    "Room 1234",
    "Page 1000",
    "Mon 1200",
    "12:00 PM 1200",
    "Completed in 2025",
    "WPI 2026",
    "NR 2025",
    "TR 2024",
  ])("doesn't take %j for a course", (text) => {
    expect(parsePastedCodes(text)).toEqual([]);
  });

  it.each(["", "   \n\t", "no codes here", "C 2102", "ABCDE 2102", "CS 21", "CS 21023", "12345", "CS2102AL01", "abcdeCS2102"])(
    "finds nothing in %j",
    (text) => {
      expect(parsePastedCodes(text)).toEqual([]);
    },
  );

  it("keeps every subject WPI really uses", () => {
    const file = path.join(process.cwd(), "e2e/fixtures/data/2027-C.json");
    const { courses } = JSON.parse(readFileSync(file, "utf8")) as { courses: { code: string }[] };
    const codes = [...new Set(courses.map((course) => course.code))];
    expect(parsePastedCodes(codes.join("\n"))).toEqual(codes);
  });

  it("gets through a very long paste quickly", () => {
    const started = Date.now();
    expect(parsePastedCodes("abcd ".repeat(400_000))).toEqual([]);
    expect(parsePastedCodes(`CS 2102 ${"-".repeat(1_000_000)}`)).toEqual(["CS 2102"]);
    expect(parsePastedCodes(`CS ${" ".repeat(1_000_000)}x`)).toEqual([]);
    expect(Date.now() - started).toBeLessThan(2_000);
  });
});

describe("parsePastedCourses term headings", () => {
  it("gives each course the term heading above it", () => {
    expect(parsePastedCourses("A Term 2025\nCS 1101 Intro\nMA 1021 Calculus\n\nB Term 2025\nCS 2102 OOP")).toEqual([
      { code: "CS 1101", term: "A Term 2025", inProgress: false },
      { code: "MA 1021", term: "A Term 2025", inProgress: false },
      { code: "CS 2102", term: "B Term 2025", inProgress: false },
    ]);
  });

  it("doesn't give the last course under a heading the next heading's term", () => {
    const found = parsePastedCourses("A25\nCS 1101\nB25\nCS 2102");
    expect(found.map((course) => course.term)).toEqual(["A Term 2025", "B Term 2025"]);
  });

  it("lets a term beside a course win over the heading above it", () => {
    const found = parsePastedCourses("A Term 2025\nCS 1101 B Term 2025\nMA 1021");
    expect(found.map((course) => course.term)).toEqual(["B Term 2025", "A Term 2025"]);
  });

  it("still reads a term written under its course when no heading comes first", () => {
    const found = parsePastedCourses("CS 1101 · Intro\nA Term 2026 · Grade A\n\nMA 1021 · Calculus\nB Term 2026 · Grade A");
    expect(found.map((course) => course.term)).toEqual(["A Term 2026", "B Term 2026"]);
  });

  it("leaves terms empty when the list could be read either way", () => {
    const found = parsePastedCourses("C Term 2027\nCS 1101\nA Term 2026\nMA 1021\nB Term 2026");
    expect(found.map((course) => course.term)).toEqual([undefined, undefined]);
  });

  it("leaves the term empty when nothing says it, rather than guessing", () => {
    expect(parsePastedCourses("Fall semester\nCS 1101\nMA 1021")).toEqual([
      { code: "CS 1101", inProgress: false },
      { code: "MA 1021", inProgress: false },
    ]);
  });
});
