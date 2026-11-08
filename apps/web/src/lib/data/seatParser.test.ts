// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { TermFile } from "./types";
import { parseSeats } from "./seatParser";

const raw = JSON.parse(readFileSync(new URL("../../../../../data/fixtures/sample-sections.json", import.meta.url), "utf8"));
const normalized: TermFile = JSON.parse(readFileSync(new URL("../../../../../data/fixtures/2027-C.small.json", import.meta.url), "utf8"));
const fields = ({ id, status, enrolled, capacity, waitlist }: TermFile["courses"][number]["sections"][number]) => ({ id, status, enrolled, capacity, waitlist });

describe("seat parser", () => {
  it("agrees with the normalized term produced from the same raw fixture", () => {
    expect(parseSeats(raw, normalized.term)).toEqual(normalized.courses.flatMap((course) => course.sections.map(fields)));
  });

  it("includes semester sections by overlapping dates, and cleans group notes and suffixes", () => {
    const row = raw.Report_Entry.find((row: { Course_Section: string }) => row.Course_Section.startsWith("AE 4310-C01"));
    const spanning = { ...row, Offering_Period: "2027 Spring Semester", Course_Section: "AE 4310-CX03-A (group 2) - Test", Course_Section_End_Date: "2027-05-05" };
    expect(parseSeats({ Report_Entry: [spanning] }, normalized.term)[0].id).toBe("AE 4310-CX03-A");
    expect(parseSeats({ Report_Entry: [{ ...spanning, Course_Section_Start_Date: "2027-04-01" }] }, normalized.term)).toEqual([]);
  });

  it("ignores placeholders, malformed rows, other terms and duplicate sections", () => {
    const row = raw.Report_Entry.find((row: { Course_Section: string }) => row.Course_Section.startsWith("AE 4310-C01"));
    const entries = [row, row, null, {}, { ...row, Enrolled_Capacity: "unknown" }, { ...row, Section_Status: "surprise" }, { ...row, Course_Section: "AE 4310-X cancelled - Test" }, { ...row, Course_Section: "AE 4310-C - Interest List" }];
    expect(parseSeats({ Report_Entry: entries }, normalized.term)).toHaveLength(1);
  });

  it("rejects a changed or empty upstream schema", () => {
    expect(() => parseSeats({}, normalized.term)).toThrow();
    expect(() => parseSeats({ Report_Entry: [] }, normalized.term)).toThrow();
  });
});
