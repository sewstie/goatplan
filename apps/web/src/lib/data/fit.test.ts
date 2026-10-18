import { describe, expect, it } from "vitest";
import { meetingSpans, meetsRules, spansOverlap } from "./fit";
import type { Section } from "./types";

type Days = Section["meetings"][number]["days"];

function section(code: string, days: Days, start: number, end: number, status: Section["status"] = "open"): Section {
  return {
    id: `AE 2320-${code}`,
    code,
    type: "lab",
    status,
    enrolled: 0,
    capacity: 40,
    waitlist: { taken: 0, capacity: 0 },
    instructors: [],
    delivery: "in-person",
    meetings: [{ days, start, end, location: "" }],
  };
}

const rules = { startsAfter: 0, blocked: [], onlyOpen: false };

describe("fit checks", () => {
  it("finds overlaps on the same day only, in 5-minute slots", () => {
    const thursday = meetingSpans([section("CX02", ["Thu"], 900, 950)]);
    expect(spansOverlap(thursday, meetingSpans([section("CX03", ["Thu"], 950, 1000)]))).toBe(false);
    expect(spansOverlap(thursday, meetingSpans([section("CX04", ["Thu"], 948, 1000)]))).toBe(true);
    expect(spansOverlap(thursday, meetingSpans([section("CX05", ["Fri"], 900, 950)]))).toBe(false);
  });

  it("applies the engine's rules: open seats, start time and blocked times", () => {
    const lab = section("CX02", ["Thu"], 900, 950);
    expect(meetsRules([lab], rules)).toBe(true);
    expect(meetsRules([section("CX01", ["Thu"], 840, 890, "closed")], { ...rules, onlyOpen: true })).toBe(false);
    expect(meetsRules([lab], { ...rules, startsAfter: 960 })).toBe(false);
    expect(meetsRules([lab], { ...rules, blocked: [{ day: "Thu", start: 940, end: 1000 }] })).toBe(false);
    expect(meetsRules([lab], { ...rules, blocked: [{ day: "Tue", start: 900, end: 950 }] })).toBe(true);
  });
});
