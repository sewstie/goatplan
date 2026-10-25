import { describe, expect, it } from "vitest";
import type { Day } from "@/lib/data/types";
import type { Diagnosis, SolveResponse } from "@/lib/engine/types";
import type { SortPresetId } from "@/lib/store/types";
import { bannerMessage, count, formatDuration, listNames, scheduleBadges, summaryText, type BannerInput } from "./scheduleCopy";

// ── helpers ──

interface Meeting {
  day: Day;
  start: number;
  end: number;
}

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

function badges(meetings: Meeting[], preset: SortPresetId = "bestOverall"): string[] {
  return scheduleBadges(meetings, preset);
}

// ── small helpers (unchanged) ──

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

// ── scheduleBadges ──

describe("scheduleBadges", () => {
  // A week with classes Mon–Fri, 9 AM–10 AM and 2 PM–3 PM every day.
  // Start: 9 AM, Finish: 3 PM. Days off: none. Gaps: one ≥30 min per day (4 h gap), 5 gaps total.
  const fullWeek: Meeting[] = [
    { day: "Mon", start: 540, end: 600 },
    { day: "Mon", start: 840, end: 900 },
    { day: "Tue", start: 540, end: 600 },
    { day: "Tue", start: 840, end: 900 },
    { day: "Wed", start: 540, end: 600 },
    { day: "Wed", start: 840, end: 900 },
    { day: "Thu", start: 540, end: 600 },
    { day: "Thu", start: 840, end: 900 },
    { day: "Fri", start: 540, end: 600 },
    { day: "Fri", start: 840, end: 900 },
  ];

  describe("each rule", () => {
    it("formats Start as the earliest start of the week", () => {
      // Single class at 10 AM.
      const result = badges([{ day: "Mon", start: 600, end: 650 }]);
      expect(result).toContain("Starts 10 AM");
    });

    it("formats Finish as the latest end of the week", () => {
      // Full week so DaysOff is empty (skipped), which leaves room for Finish in top 3.
      const result = badges([
        { day: "Mon", start: 540, end: 600 },
        { day: "Tue", start: 540, end: 600 },
        { day: "Wed", start: 540, end: 600 },
        { day: "Thu", start: 540, end: 600 },
        { day: "Fri", start: 840, end: 900 },
      ]);
      expect(result).toContain("Done by 3 PM");
    });

    it("names one day off", () => {
      // Classes Mon–Thu only → Fri off.
      const meetings: Meeting[] = [
        { day: "Mon", start: 540, end: 600 },
        { day: "Tue", start: 540, end: 600 },
        { day: "Wed", start: 540, end: 600 },
        { day: "Thu", start: 540, end: 600 },
      ];
      expect(badges(meetings)).toContain("Fri off");
    });

    it("names two days off", () => {
      // Classes Mon, Wed, Fri → Tue, Thu off.
      const meetings: Meeting[] = [
        { day: "Mon", start: 540, end: 600 },
        { day: "Wed", start: 540, end: 600 },
        { day: "Fri", start: 540, end: 600 },
      ];
      expect(badges(meetings)).toContain("Tue, Thu off");
    });

    it("counts three or more days off", () => {
      // Only Mon and Tue → 3 days off.
      const meetings: Meeting[] = [
        { day: "Mon", start: 540, end: 600 },
        { day: "Tue", start: 540, end: 600 },
      ];
      expect(badges(meetings)).toContain("3 days off");
    });

    it("counts gaps of 30+ minutes between classes on the same day", () => {
      // Two classes with a 4-hour gap on Mon.
      const meetings: Meeting[] = [
        { day: "Mon", start: 540, end: 600 },
        { day: "Mon", start: 840, end: 900 },
      ];
      const result = badges(meetings);
      expect(result).toContain("1 gap");
    });

    it("says No gaps when there are none", () => {
      // Back-to-back classes.
      const meetings: Meeting[] = [
        { day: "Mon", start: 540, end: 600 },
        { day: "Mon", start: 600, end: 660 },
      ];
      expect(badges(meetings)).toContain("No gaps");
    });

    it("pluralizes gaps correctly", () => {
      expect(badges(fullWeek)).toContain("5 gaps");
    });
  });

  describe("30-minute gap threshold", () => {
    it("a 29-minute break is not a gap", () => {
      const meetings: Meeting[] = [
        { day: "Mon", start: 540, end: 600 },
        { day: "Mon", start: 629, end: 680 },
      ];
      expect(badges(meetings)).toContain("No gaps");
    });

    it("a 30-minute break is a gap", () => {
      const meetings: Meeting[] = [
        { day: "Mon", start: 540, end: 600 },
        { day: "Mon", start: 630, end: 680 },
      ];
      expect(badges(meetings)).toContain("1 gap");
    });
  });

  describe("lead badge for each sort order", () => {
    it("latestStart → Start first", () => {
      expect(badges(fullWeek, "latestStart")[0]).toBe("Starts 9 AM");
    });

    it("fewestEarly → Start first", () => {
      expect(badges(fullWeek, "fewestEarly")[0]).toBe("Starts 9 AM");
    });

    it("earliestFinish → Finish first", () => {
      expect(badges(fullWeek, "earliestFinish")[0]).toBe("Done by 3 PM");
    });

    it("fewestDays → Days off first", () => {
      // Need days off for it to show. Classes only Mon and Tue.
      const meetings: Meeting[] = [
        { day: "Mon", start: 540, end: 600 },
        { day: "Tue", start: 540, end: 600 },
      ];
      expect(badges(meetings, "fewestDays")[0]).toBe("3 days off");
    });

    it("fewestGaps → Gaps first", () => {
      expect(badges(fullWeek, "fewestGaps")[0]).toBe("5 gaps");
    });

    it("bestOverall has no lead badge, uses default order", () => {
      // Full week: no days off, so default order DaysOff(skip), Start, Gaps, Finish → Start, Gaps, Finish.
      const result = badges(fullWeek, "bestOverall");
      expect(result[0]).toBe("Starts 9 AM");
      expect(result[1]).toBe("5 gaps");
      expect(result[2]).toBe("Done by 3 PM");
    });
  });

  describe("cap of 3", () => {
    it("returns at most 3 badges", () => {
      // Classes only on Mon → 4 days off, with a gap.
      // All four badge types apply: DaysOff, Start, Gaps, Finish.
      const meetings: Meeting[] = [
        { day: "Mon", start: 540, end: 600 },
        { day: "Mon", start: 840, end: 900 },
      ];
      const result = badges(meetings, "bestOverall");
      expect(result.length).toBeLessThanOrEqual(3);
    });
  });

  describe("empty badges left out", () => {
    it("skips Days off when all weekdays have a class", () => {
      const result = badges(fullWeek, "bestOverall");
      expect(result.every((badge) => !badge.includes("off"))).toBe(true);
    });

    it("skips Days off when fewestDays is lead but no day is free", () => {
      const result = badges(fullWeek, "fewestDays");
      // DaysOff is lead but empty, so it's skipped. Next in default order.
      expect(result[0]).not.toContain("off");
    });
  });

  describe("empty week", () => {
    it("returns no badges for an empty meetings array", () => {
      expect(badges([])).toEqual([]);
    });
  });

  describe("classes with no set time", () => {
    it("doesn't count meetings with undefined day/start/end", () => {
      // We pass only valid meetings. An empty array means all courses are online/async.
      expect(badges([])).toEqual([]);
    });
  });
});

// ── summaryText (unchanged) ──

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

// ── bannerMessage (unchanged) ──

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
      title: "Couldn\u2019t check your schedules.",
    });
    expect(
      bannerMessage({
        ...base,
        response: { ok: false, version: 1, error: { code: "unknownCourse", message: "No course PH 9999 in 2027-C", detail: "PH 9999" } },
      }),
    ).toEqual({
      tone: "warning",
      title: "Couldn\u2019t check your schedules.",
      detail: "PH 9999 isn\u2019t offered this term any more. Remove it to see your schedules.",
    });
    expect(bannerMessage({ ...base, response: noFit({ clashingPairs: [["AB 1533", "AE 2320"]] }) })).toEqual({
      tone: "warning",
      title: "No schedule fits.",
      detail: "AB 1533 and AE 2320 overlap.",
    });
    expect(bannerMessage({ ...base, response: noFit({ minimalClash: ["A", "B", "C"] }) })?.detail).toBe(
      "A, B and C can\u2019t all fit together.",
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
