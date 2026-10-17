import { describe, expect, it } from "vitest";
import type { Course, TermFile } from "@/lib/data/types";
import { buildPresets } from "./presets";

function course(code: string, options: number, timed = true): Course {
  return {
    code,
    subject: code.split(" ")[0],
    title: code,
    credits: 3,
    level: "Undergraduate",
    description: "",
    sections: [
      {
        id: `${code}-A01`,
        code: "A01",
        type: "lecture",
        status: "open",
        enrolled: 0,
        capacity: 10,
        waitlist: { taken: 0, capacity: 0 },
        instructors: [],
        delivery: timed ? "in-person" : "online-async",
        meetings: timed ? [{ days: ["Mon"], start: 540, end: 590, location: "" }] : [],
      },
    ],
    options: Array.from({ length: options }, () => [`${code}-A01`]),
  };
}

const term: TermFile = {
  term: { id: "2027-C", name: "C Term", season: "Spring", year: 2027, start: "2027-01-13", end: "2027-03-05" },
  generatedAt: "2026-10-17T12:52:39Z",
  courses: [
    course("AA 1", 1),
    course("BB 2", 50),
    course("CC 3", 9),
    course("DD 4", 400, false),
    course("EE 5", 20),
  ],
};

describe("buildPresets", () => {
  const presets = buildPresets(term);

  it("uses the timed courses with the most options", () => {
    expect(presets.basic.courses).toEqual(["BB 2", "EE 5", "CC 3"]);
    expect(presets.large.courses).toEqual(["BB 2", "EE 5", "CC 3", "AA 1"]);
  });

  it("asks for the most work the engine allows in the large preset", () => {
    expect(presets.large.limits).toEqual({ maxSchedules: 500, stepBudget: 50_000_000 });
  });

  it("starts too late for anything to fit in the nothing-fits preset", () => {
    expect(presets.nothingFits.preferences?.startsAfter).toBe(1430);
  });
});
