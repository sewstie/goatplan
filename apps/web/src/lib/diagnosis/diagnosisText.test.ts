import { describe, expect, it } from "vitest";
import type { Diagnosis, EmptyCourse, Fix } from "@/lib/engine/types";
import { term as fixture } from "@/components/schedule/testing/plannerFixtures";
import { diagnosisText, fixText, type DiagnosisContext } from "./diagnosisText";

const empty = (changes: Partial<EmptyCourse> = {}): EmptyCourse => ({
  code: "AE 2320", optionsInData: 3,
  removed: { notAnyOf: 0, notLocked: 0, notOpen: 0, startsTooEarly: 3, blocked: 0 },
  latestStartsAfter: 540, ...changes,
});
const diagnosis = (changes: Partial<Diagnosis>): Diagnosis => ({
  unsure: false, emptyCourses: [], clashingPairs: [], minimalClash: [], fixes: [], ...changes,
});
const context = (changes: Partial<DiagnosisContext> = {}): DiagnosisContext => ({
  term: structuredClone(fixture), preferences: { startsAfter: 600, blocked: [], onlyOpen: true }, locks: {}, ...changes,
});

describe("diagnosisText", () => {
  it("explains professor exclusions and keeps the engine's counted clearAnyOf fix", () => {
    const fix: Fix = { kind: "clearAnyOf", course: "AE 2320", schedules: 2, capped: false };
    const result = diagnosisText(diagnosis({
      emptyCourses: [empty({ removed: { notLocked: 0, notAnyOf: 3, notOpen: 0, startsTooEarly: 0, blocked: 0 } })],
      fixes: [fix],
    }), context({ professorByCourse: { "AE 2320": "Ye Lu" } }));
    expect(result.issues[0]).toMatchObject({
      kind: "professor",
      title: "Your professor choice leaves no options",
      detail: "AE 2320 has no section choices left. 3 section choices do not include a section taught by Ye Lu.",
    });
    expect(result.fixes[0]).toEqual({ fix, label: "Allow any professor for AE 2320", count: "2 schedules fit" });
    expect(result.fixes[0].fix).toBe(fix);
  });

  it("matches the start-time frame when the only lecture proves the reason", () => {
    const result = diagnosisText(diagnosis({ emptyCourses: [empty()] }), context());
    expect(result.issues[0]).toMatchObject({
      title: "Your start time is too late",
      detail: "AE 2320’s only lecture starts at 9:00, so nothing works with “Starts after 10:00 AM”.",
      summary: "Your start-time preference excludes AE 2320.",
      banner: { title: "Starts after 10:00 AM", detail: "excludes AE 2320’s only lecture at 9:00 AM." },
      sectionIds: ["AE 2320-CL01"], excludedSectionIds: ["AE 2320-CL01"],
    });
  });

  it("explains a locked full lab and names available replacements", () => {
    const input = context({ preferences: { startsAfter: 540, blocked: [], onlyOpen: true }, locks: { "AE 2320": ["AE 2320-CX01"] } });
    input.term!.courses[0].sections[1].status = "closed";
    input.term!.courses[0].sections[1].enrolled = 40;
    const result = diagnosisText(diagnosis({ emptyCourses: [empty({ removed: { notAnyOf: 0, notLocked: 2, notOpen: 1, startsTooEarly: 0, blocked: 0 } })] }), input);
    expect(result.issues[0]).toMatchObject({
      title: "This lock leaves no options",
      detail: "Locking CX01 leaves no options because it’s full. Unlock it to consider CX02 or CX03.",
      summary: "Your locked lab has no open seats.",
      problemSectionIds: ["AE 2320-CX01"],
    });
  });

  it("matches the all-full frame without calling open component sections full", () => {
    const input = context();
    input.term!.courses[1].sections[0].status = "closed";
    const result = diagnosisText(diagnosis({ emptyCourses: [empty({ code: "AE 2410", optionsInData: 1, removed: { notAnyOf: 0, notLocked: 0, notOpen: 1, startsTooEarly: 0, blocked: 0 } })] }), input);
    expect(result.issues[0]).toMatchObject({
      title: "Every section is full",
      detail: "Every AE 2410 section is full. Show full sections, or join a waitlist in Workday.",
      summary: "AE 2410 has no open sections.",
    });
    input.term!.courses[0].sections[0].status = "closed";
    const mixed = diagnosisText(diagnosis({ emptyCourses: [empty({ removed: { notAnyOf: 0, notLocked: 0, notOpen: 3, startsTooEarly: 0, blocked: 0 } })] }), input);
    expect(mixed.issues[0].title).toBe("No open section choices");
    expect(mixed.issues[0].detail).toBe("Every section choice for AE 2320 includes a full or waitlisted section.");
    expect(mixed.issues[0].summary).toBe("AE 2320 has no open section choices.");
  });

  it("calls mixed locked lectures and labs sections", () => {
    const input = context({ preferences: { startsAfter: 540, blocked: [], onlyOpen: true }, locks: { "AE 2320": ["AE 2320-CL01", "AE 2320-CX01"] } });
    input.term!.courses[0].sections[0].status = "closed";
    input.term!.courses[0].sections[1].status = "closed";
    const result = diagnosisText(diagnosis({ emptyCourses: [empty({ removed: { notAnyOf: 0, notLocked: 2, notOpen: 1, startsTooEarly: 0, blocked: 0 } })] }), input);
    expect(result.issues[0].summary).toBe("Your locked sections have no open seats.");
  });

  it("explains every first-removal count, without counting one choice twice", () => {
    const result = diagnosisText(diagnosis({ emptyCourses: [empty({ optionsInData: 7, removed: { notAnyOf: 0, notLocked: 1, notOpen: 2, startsTooEarly: 1, blocked: 3 } })] }), context());
    expect(result.issues[0].detail).toBe("AE 2320 has no section choices left. 1 section choice does not include all your locked sections. 2 section choices include full or waitlisted sections. 1 section choice starts before 10:00 AM. 3 section choices overlap your blocked times.");
  });

  it("lists every empty course and explains absent source choices without guessing why", () => {
    const result = diagnosisText(diagnosis({ emptyCourses: [empty(), empty({ code: "AE 5131", optionsInData: 0, removed: { notAnyOf: 0, notLocked: 0, notOpen: 0, startsTooEarly: 0, blocked: 0 } })] }), context());
    expect(result.issues).toHaveLength(2);
    expect(result.issues[1]).toMatchObject({ title: "No sections to choose from", detail: "AE 5131 has no section choices in this term." });
  });

  it("explains blocked times and handles missing section data", () => {
    const result = diagnosisText(diagnosis({ emptyCourses: [empty({ removed: { notAnyOf: 0, notLocked: 0, notOpen: 0, startsTooEarly: 0, blocked: 3 } })] }), context({ term: null }));
    expect(result.issues[0].title).toBe("Your blocked times overlap");
    expect(result.issues[0].detail).toContain("3 section choices overlap your blocked times.");
    const locked = diagnosisText(diagnosis({ emptyCourses: [empty({ removed: { notAnyOf: 0, notLocked: 2, notOpen: 0, startsTooEarly: 0, blocked: 1 } })] }), context());
    expect(locked.issues[0].title).toBe("Your blocked times overlap");
  });

  it("gives exact sections, shared days and overlap times only when they are unavoidable", () => {
    const input = context({ preferences: { startsAfter: 0, blocked: [], onlyOpen: true } });
    input.term!.courses[1].sections[0].meetings = [{ days: ["Mon", "Tue", "Thu", "Fri"], start: 540, end: 590, location: "" }];
    const result = diagnosisText(diagnosis({ clashingPairs: [["AE 2320", "AE 2410"]] }), input);
    expect(result.issues[0]).toMatchObject({
      title: "Two lectures overlap",
      detail: "AE 2320 CL01 and AE 2410 C01 both meet Mon, Tue, Thu, Fri from 9:00–9:50 AM.",
      problemSectionIds: ["AE 2320-CL01", "AE 2410-C01"],
    });
    input.term!.courses[1].options.push(["AE 2410-missing"]);
    const varied = diagnosisText(diagnosis({ clashingPairs: [["AE 2320", "AE 2410"]] }), input);
    expect(varied.issues[0].title).toBe("These courses never fit together");
    expect(varied.issues[0].problemSectionIds).toEqual([]);
  });

  it("lists all clashing pairs, not just the first", () => {
    const result = diagnosisText(diagnosis({ clashingPairs: [["A", "B"], ["A", "C"]] }), context({ term: null }));
    expect(result.issues.map((issue) => issue.courses)).toEqual([["A", "B"], ["A", "C"]]);
  });

  it("names the engine's clashing group without claiming a globally smallest group", () => {
    const result = diagnosisText(diagnosis({ minimalClash: ["A", "B", "C"] }), context());
    expect(result.issues[0].detail).toBe("A, B and C can’t all fit together with your current preferences.");
  });

  it("never presents an incomplete search as a proven clash or offers its stale fixes", () => {
    expect(diagnosisText(diagnosis({ unsure: true, emptyCourses: [empty()], fixes: [{ kind: "allowFull", schedules: 1, capped: false }] }), context()))
      .toEqual({ issues: [], fixes: [] });
  });
});

describe("fixText", () => {
  it.each([
    [{ kind: "relaxStartsAfter", startsAfter: 540 }, "Change to 9:00 AM"],
    [{ kind: "relaxStartsAfter", startsAfter: 0 }, "Allow any start time"],
    [{ kind: "clearBlocked" }, "Clear blocked times"],
    [{ kind: "allowFull" }, "Show full sections"],
    [{ kind: "dropCourse", course: "AE 2320" }, "Remove AE 2320"],
    [{ kind: "unlock", course: "AE 2320" }, "Unlock CX01"],
  ])("labels %j", (input, label) => {
    const fix = { ...input, schedules: 1, capped: false } as Fix;
    expect(fixText(fix, context({ locks: { "AE 2320": ["AE 2320-CX01"] } })))
      .toEqual({ fix, label, count: "1 schedule fits" });
  });

  it("uses course-wide unlock wording for multiple locks, and labels capped counts as lower bounds", () => {
    expect(fixText({ kind: "unlock", course: "AE 2320", schedules: 1234, capped: true }, context()).label).toBe("Unlock AE 2320");
    expect(fixText({ kind: "allowFull", schedules: 1234, capped: true }, context()).count).toBe("At least 1,234 schedules fit");
  });
});
