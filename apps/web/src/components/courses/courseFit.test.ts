import { describe, expect, it } from "vitest";
import { DEFAULT_PREFERENCES } from "@/lib/store/draft";
import type { PlanPreferences } from "@/lib/store/types";
import { courseFit, fitText, type FitPlan } from "./courseFit";
import { ab1533, ae2210, ae2320, ae2410, course, cs2102, meeting, section } from "./testing/courses";

const preferences: PlanPreferences = { ...DEFAULT_PREFERENCES, startsAfter: 0, onlyOpen: true };

function plan(changes: Partial<FitPlan> = {}): FitPlan {
  return {
    courses: [ae2320],
    chosen: { "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"] },
    locks: {},
    preferences,
    ...changes,
  };
}

describe("courseFit", () => {
  it("fits when the plan is empty", () => {
    expect(courseFit(ae2210, plan({ courses: [], chosen: {} }))).toEqual({ kind: "fits" });
  });

  it("fits when an option fits around the schedule on screen", () => {
    expect(courseFit(ae2210, plan())).toEqual({ kind: "fits" });
  });

  it("names the planned course and the type of section it clashes with", () => {
    expect(courseFit(ab1533, plan())).toEqual({ kind: "clash", course: "AE 2320", sectionType: "lecture" });
  });

  it("finds a clash without a schedule on screen, from the planned course's options", () => {
    expect(courseFit(ab1533, plan({ chosen: {} }))).toEqual({ kind: "clash", course: "AE 2320", sectionType: "lecture" });
  });

  it("names a lab when the lab is what gets in the way", () => {
    const thursdayLabs = course("ME 1800", "Manufacturing Science", [
      section("ME 1800", "C01", { meetings: [meeting(["Thu"], 840, 1010)] }),
    ]);
    expect(courseFit(thursdayLabs, plan())).toEqual({ kind: "clash", course: "AE 2320", sectionType: "lab" });
  });

  it("says all sections are full only while full sections are skipped", () => {
    expect(courseFit(ae2410, plan())).toEqual({ kind: "full" });
    expect(courseFit(ae2410, plan({ preferences: { ...preferences, onlyOpen: false } }))).toEqual({ kind: "fits" });
  });

  it("follows the start-time and blocked-time preferences like the engine", () => {
    expect(courseFit(ae2210, plan({ preferences: { ...preferences, startsAfter: 720 } }))).toBeNull();
    const blocked = [{ day: "Wed" as const, start: 660, end: 680 }];
    expect(courseFit(ae2210, plan({ preferences: { ...preferences, blocked } }))).toBeNull();
    const touching = [{ day: "Wed" as const, start: 710, end: 760 }];
    expect(courseFit(ae2210, plan({ preferences: { ...preferences, blocked: touching } }))).toEqual({ kind: "fits" });
  });

  it("can't tell when the course only fits with other sections of a planned course", () => {
    // Fits with lab CX01 or CX03, but not around CX02, which is on screen.
    const thursdayAt3 = course("ME 1800", "Manufacturing Science", [
      section("ME 1800", "C01", { meetings: [meeting(["Thu"], 900, 950)] }),
    ]);
    expect(courseFit(thursdayAt3, plan())).toBeNull();
  });

  it("respects locks on planned courses when looking for a clash", () => {
    const thursdayAt2 = course("ME 1800", "Manufacturing Science", [
      section("ME 1800", "C01", { meetings: [meeting(["Thu"], 840, 890)] }),
    ]);
    const locked = plan({ chosen: {}, locks: { "AE 2320": ["AE 2320-CX01"] } });
    expect(courseFit(thursdayAt2, locked)).toEqual({ kind: "clash", course: "AE 2320", sectionType: "lab" });
    expect(courseFit(thursdayAt2, plan({ chosen: {} }))).toBeNull();
  });

  it("checks every planned course and names the first one it clashes with", () => {
    const twoCourses = plan({
      courses: [ae2210, ae2320],
      chosen: { "AE 2210": ["AE 2210-C01"], "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"] },
    });
    expect(courseFit(ab1533, twoCourses)).toEqual({ kind: "clash", course: "AE 2320", sectionType: "lecture" });
    expect(courseFit(cs2102, twoCourses)).toEqual({ kind: "fits" });
  });

  it("says nothing for a course with no options at all", () => {
    expect(courseFit(course("XX 1000", "Nothing", []), plan())).toBeNull();
  });
});

describe("fitText", () => {
  it("uses the words from the design", () => {
    expect(fitText({ kind: "fits" })).toBe("Fits");
    expect(fitText({ kind: "full" })).toBe("All sections full");
    expect(fitText({ kind: "clash", course: "AE 2320", sectionType: "lecture" })).toBe("Clashes with AE 2320 lecture");
    expect(fitText({ kind: "clash", course: "AE 2320", sectionType: "other" })).toBe("Clashes with AE 2320");
  });
});
