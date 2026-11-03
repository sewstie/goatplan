import { describe, expect, it } from "vitest";
import { section } from "@/lib/plans/testing";
import type { SavedCourse } from "@/lib/plans/types";
import { exportLine, exportSummary } from "./summary";
import { termCalendar } from "./term-calendar";

const term = { start: "2027-01-13", end: "2027-03-05" };
const timed = (code: string): SavedCourse => ({ code, sections: [section(code, "C01", { meetings: [{ days: ["Mon"], start: 600, end: 650, location: "" }] })] }) as SavedCourse;
const untimed = (code: string): SavedCourse => ({ code, sections: [section(code, "C01", { meetings: [] })] }) as SavedCourse;

describe("exportLine", () => {
  it("counts classes and says how many have no set time", () => {
    expect(exportLine(exportSummary([timed("A 1"), timed("B 1"), untimed("C 1")], term, null))).toBe("2 classes · Jan 13–Mar 5, 2027 · 1 left out");
  });

  it("leaves out the count of skipped classes when there are none", () => {
    expect(exportLine(exportSummary([timed("A 1")], term, null))).toBe("1 class · Jan 13–Mar 5, 2027");
  });
});

describe("exportSummary", () => {
  it("names each day with no classes, Academic Advising Day included", () => {
    expect(exportSummary([timed("A 1")], term, termCalendar("2027-C")).holidays).toEqual([
      "Jan 18 · Martin Luther King, Jr. Day",
      "Feb 12 · Wellness Day",
      "Feb 25 · Academic Advising Day",
    ]);
  });
});
