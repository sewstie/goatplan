import { describe, expect, it } from "vitest";
import type { Diagnosis, SolveResponse } from "@/lib/engine/types";
import { bannerMessage, count, formatDuration, listNames, scoreChips, summaryText, type BannerInput } from "./scheduleCopy";

function solved(changes: Partial<Extract<SolveResponse, { ok: true }>> = {}): SolveResponse {
  return {
    ok: true,
    version: 1,
    termId: "2027-C",
    total: 24,
    patterns: 24,
    capped: false,
    steps: 10,
    elapsedMs: 1,
    schedules: [],
    diagnosis: null,
    ...changes,
  };
}

function noFit(diagnosis: Partial<Diagnosis>): SolveResponse {
  return solved({
    total: 0,
    patterns: 0,
    diagnosis: { unsure: false, emptyCourses: [], clashingPairs: [], minimalClash: [], fixes: [], ...diagnosis },
  });
}

describe("small helpers", () => {
  it("counts with the right plural", () => {
    expect(count("course", 1)).toBe("1 course");
    expect(count("course", 3)).toBe("3 courses");
    expect(count("schedule", 3252)).toBe("3,252 schedules");
  });

  it("lists names in plain English", () => {
    expect(listNames(["A"])).toBe("A");
    expect(listNames(["A", "B"])).toBe("A and B");
    expect(listNames(["A", "B", "C"])).toBe("A, B and C");
  });

  it("writes durations in hours and minutes", () => {
    expect(formatDuration(50)).toBe("50 min");
    expect(formatDuration(60)).toBe("1 h");
    expect(formatDuration(150)).toBe("2 h 30 min");
  });
});

describe("scoreChips", () => {
  it("describes days, gaps and early classes", () => {
    expect(scoreChips({ total: 1430, days: 5, gapMinutes: 230, earlyMinutes: 300 })).toEqual([
      "5 days on campus",
      "3 h 50 min between classes",
      "5 h of early classes",
    ]);
  });

  it("says when there are no gaps or early classes", () => {
    expect(scoreChips({ total: 0, days: 1, gapMinutes: 0, earlyMinutes: 0 })).toEqual([
      "1 day on campus",
      "No gaps between classes",
      "No early classes",
    ]);
  });
});

describe("summaryText", () => {
  const base = {
    termStatus: "ready" as const,
    termName: "C Term",
    courseCount: 3,
    response: solved(),
    untimedCourses: 0,
    hasWaitlist: false,
  };

  it("follows the designs", () => {
    expect(summaryText({ ...base, termStatus: "loading" })).toBe("Loading C Term sections…");
    expect(summaryText({ ...base, courseCount: 0 })).toBe("Add courses to start planning your term.");
    expect(summaryText(base)).toBe("3 courses · 24 schedules fit");
    expect(summaryText({ ...base, response: solved({ patterns: 1, total: 1 }) })).toBe("3 courses · 1 schedule fits");
    expect(summaryText({ ...base, courseCount: 4, untimedCourses: 1, response: solved({ patterns: 1 }) })).toBe(
      "4 courses · 1 schedule fits · 1 course has no set time",
    );
    expect(summaryText({ ...base, hasWaitlist: true, response: solved({ patterns: 1 }) })).toBe(
      "3 courses · 1 schedule fits · includes a waitlist section",
    );
    expect(summaryText({ ...base, courseCount: 4, response: noFit({ clashingPairs: [["AB 1533", "AE 2320"]] }) })).toBe(
      "4 courses · AB 1533 and AE 2320 overlap",
    );
  });

  it("marks counts the engine couldn't finish", () => {
    expect(summaryText({ ...base, response: solved({ patterns: 16544, capped: true }) })).toBe(
      "3 courses · 16,544+ schedules fit",
    );
  });

  it("doesn't describe stale schedules as fitting while solving or after an engine crash", () => {
    expect(summaryText({ ...base, solveStatus: "solving" })).toBe("3 courses");
    expect(summaryText({ ...base, solveStatus: "error" })).toBe("3 courses");
    expect(summaryText({ ...base, response: noFit({ unsure: true }) })).toBe("3 courses · Search incomplete");
  });

  it("says nothing while there is no term", () => {
    expect(summaryText({ ...base, termStatus: "idle" })).toBeNull();
    expect(summaryText({ ...base, termStatus: "error" })).toBeNull();
    expect(summaryText({ ...base, termStatus: "loading", termName: null })).toBeNull();
  });

  it("only counts courses before the engine answers", () => {
    expect(summaryText({ ...base, courseCount: 1, response: null })).toBe("1 course");
  });
});

describe("bannerMessage", () => {
  const base: BannerInput = {
    courseCount: 3,
    solveStatus: "done",
    slow: false,
    solveError: null,
    response: solved({ patterns: 24 }),
    shownSchedules: 24,
    waitlisted: [],
  };

  it("shows nothing for a normal answer or an empty plan", () => {
    expect(bannerMessage(base)).toBeNull();
    expect(bannerMessage({ ...base, courseCount: 0, solveStatus: "error" })).toBeNull();
  });

  it("notes when only the best schedules are shown", () => {
    expect(bannerMessage({ ...base, response: solved({ patterns: 3252 }), shownSchedules: 200 })).toEqual({
      tone: "info",
      title: "Showing the best 200 of 3,252 schedules.",
      detail: "Lock a section or add preferences to narrow it down.",
    });
    expect(bannerMessage({ ...base, response: solved({ patterns: 16544, capped: true }), shownSchedules: 200 })).toEqual({
      tone: "info",
      title: "There are too many combinations to check them all.",
      detail: "Showing the best 200 schedules found. Lock a section or add preferences to narrow it down.",
    });
  });

  it("says the engine is working only once it's slow", () => {
    expect(bannerMessage({ ...base, solveStatus: "solving" })).toBeNull();
    expect(bannerMessage({ ...base, solveStatus: "solving", slow: true })).toMatchObject({
      tone: "loading",
      title: "Finding schedules…",
    });
  });

  it("warns when the engine fails or nothing fits", () => {
    expect(bannerMessage({ ...base, solveStatus: "error", solveError: "The worker crashed." })).toMatchObject({
      tone: "warning",
      title: "Couldn’t check your schedules.",
    });
    expect(
      bannerMessage({
        ...base,
        response: { ok: false, version: 1, error: { code: "unknownCourse", message: "No course PH 9999 in 2027-C", detail: "PH 9999" } },
      }),
    ).toEqual({
      tone: "warning",
      title: "Couldn’t check your schedules.",
      detail: "PH 9999 isn’t offered this term any more. Remove it to see your schedules.",
    });
    expect(bannerMessage({ ...base, response: noFit({ clashingPairs: [["AB 1533", "AE 2320"]] }) })).toEqual({
      tone: "warning",
      title: "No schedule fits.",
      detail: "AB 1533 and AE 2320 overlap.",
    });
    expect(bannerMessage({ ...base, response: noFit({ minimalClash: ["A", "B", "C"] }) })?.detail).toBe(
      "A, B and C can’t all fit together.",
    );
    expect(bannerMessage({ ...base, response: noFit({ unsure: true }) })?.title).toBe("Too many combinations to check.");
  });

  it("tells about waitlist-only sections (div.app-15.md)", () => {
    expect(bannerMessage({ ...base, waitlisted: [{ courseCode: "AE 2410", sectionCode: "C01" }] })).toEqual({
      tone: "info",
      title: "AE 2410 C01 is waitlist only.",
      detail: "It fits your times, but registration is not guaranteed.",
    });
    const capped = bannerMessage({ ...base, response: solved({ capped: true }), waitlisted: [{ courseCode: "AE 2410", sectionCode: "C01" }] });
    expect(capped?.title).toBe("There are too many combinations to check them all.");
    expect(capped?.detail).toContain("AE 2410 C01 is waitlist only. Registration is not guaranteed.");
  });
});
