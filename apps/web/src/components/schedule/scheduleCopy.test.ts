import { describe, expect, it } from "vitest";
import type { Day } from "@/lib/data/types";
import type { Diagnosis, SolveResponse } from "@/lib/engine/types";
import type { SortPresetId } from "@/lib/store/types";
import { bannerMessage, count, formatDuration, listNames, scheduleBadgeDetails, scheduleBadges, summaryText, type BannerInput } from "./scheduleCopy";

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

/** The badges for these meetings, with the engine's free time when given (a score without it is from an older plan). */
function badges(meetings: Meeting[], preset: SortPresetId = "bestOverall", freeMinutes?: number): string[] {
  return scheduleBadges(meetings, freeMinutes === undefined ? {} : { freeMinutes }, preset);
}

const FREE_TIME = /free between classes$|^No gaps between classes$/;

/** The free-time badge, found by its wording wherever it sits. */
function freeTime(meetings: Meeting[], freeMinutes?: number): string | undefined {
  return badges(meetings, "fewestGaps", freeMinutes).find((badge) => FREE_TIME.test(badge));
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
  // Start: 9 AM, Finish: 3 PM. Days off: none. Free time: 4 h a day, 20 h in all.
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
  const fullWeekFree = 1200;

  describe("each rule", () => {
    it("formats Start as the earliest start of the week", () => {
      // Single class at 10 AM.
      const result = badges([{ day: "Mon", start: 600, end: 650 }], "bestOverall", 0);
      expect(result).toContain("Starts 10 AM");
    });

    it("formats Finish as the latest end of the week", () => {
      // Full week so DaysOff is empty (skipped), which leaves room for Finish in top 3.
      const result = badges(
        [
          { day: "Mon", start: 540, end: 600 },
          { day: "Tue", start: 540, end: 600 },
          { day: "Wed", start: 540, end: 600 },
          { day: "Thu", start: 540, end: 600 },
          { day: "Fri", start: 840, end: 900 },
        ],
        "bestOverall",
        0,
      );
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
      expect(badges(meetings, "bestOverall", 0)).toContain("Fri off");
    });

    it("names two days off", () => {
      // Classes Mon, Wed, Fri → Tue, Thu off.
      const meetings: Meeting[] = [
        { day: "Mon", start: 540, end: 600 },
        { day: "Wed", start: 540, end: 600 },
        { day: "Fri", start: 540, end: 600 },
      ];
      expect(badges(meetings, "bestOverall", 0)).toContain("Tue, Thu off");
    });

    it("counts three or more days off", () => {
      // Only Mon and Tue → 3 days off.
      const meetings: Meeting[] = [
        { day: "Mon", start: 540, end: 600 },
        { day: "Tue", start: 540, end: 600 },
      ];
      expect(badges(meetings, "bestOverall", 0)).toContain("3 days off");
    });
  });

  describe("free time between classes, from the score", () => {
    // Two classes 4 h apart: the badge must say what the score says, not what the meetings add up to.
    const mondayWithBreak: Meeting[] = [
      { day: "Mon", start: 540, end: 600 },
      { day: "Mon", start: 840, end: 900 },
    ];

    it.each([
      [0, "No gaps between classes"],
      [40, "40 min free between classes"],
      [60, "1 h free between classes"],
      [75, "1.5 h free between classes"],
      [150, "2.5 h free between classes"],
      [180, "3 h free between classes"],
    ])("%i minutes read “%s”", (minutes, text) => {
      expect(freeTime(mondayWithBreak, minutes)).toBe(text);
    });

    it("writes 1 to 59 minutes in minutes", () => {
      expect(freeTime(mondayWithBreak, 1)).toBe("1 min free between classes");
      expect(freeTime(mondayWithBreak, 59)).toBe("59 min free between classes");
    });

    it("rounds an hour or more to the nearest 30 minutes", () => {
      expect(freeTime(mondayWithBreak, 74)).toBe("1 h free between classes");
      expect(freeTime(mondayWithBreak, 105)).toBe("2 h free between classes");
      expect(freeTime(mondayWithBreak, 164)).toBe("2.5 h free between classes");
      expect(freeTime(mondayWithBreak, 165)).toBe("3 h free between classes");
    });

    it("never says more free time for less, so Most compact's #1 never reads worse than #2", () => {
      const minutes = (text: string | undefined) => {
        const hours = text?.match(/^([\d.]+) h /);
        if (hours) return Number(hours[1]) * 60;
        return Number(text?.match(/^(\d+) min /)?.[1] ?? 0);
      };
      for (let less = 0; less < 300; less++) {
        expect(minutes(freeTime(mondayWithBreak, less))).toBeLessThanOrEqual(minutes(freeTime(mondayWithBreak, less + 1)));
      }
    });

    it("has no count of gaps any more", () => {
      for (const minutes of [0, 40, 150]) {
        expect(badges(fullWeek, "bestOverall", minutes).some((badge) => /^\d+ gaps?$|^No gaps$/.test(badge))).toBe(false);
      }
    });
  });

  describe("free time from the meetings, for a plan saved without it", () => {
    it("ignores the 10-minute walks between back-to-back classes", () => {
      const meetings: Meeting[] = [
        { day: "Mon", start: 540, end: 590 },
        { day: "Mon", start: 600, end: 650 },
        { day: "Mon", start: 660, end: 710 },
      ];
      expect(freeTime(meetings)).toBe("No gaps between classes");
    });

    it("adds up every break longer than 10 minutes, day by day", () => {
      // Mon: 15 + 65 min, Wed: 130 min. 210 min in all.
      const meetings: Meeting[] = [
        { day: "Mon", start: 540, end: 590 },
        { day: "Mon", start: 605, end: 655 },
        { day: "Mon", start: 665, end: 710 },
        { day: "Mon", start: 775, end: 825 },
        { day: "Wed", start: 540, end: 590 },
        { day: "Wed", start: 720, end: 770 },
      ];
      expect(freeTime(meetings)).toBe("3.5 h free between classes");
    });

    it("counts an 11-minute break, in any meeting order", () => {
      const meetings: Meeting[] = [
        { day: "Tue", start: 611, end: 660 },
        { day: "Tue", start: 540, end: 600 },
      ];
      expect(freeTime(meetings)).toBe("11 min free between classes");
    });

    it("doesn't count the time between classes on different days", () => {
      const meetings: Meeting[] = [
        { day: "Mon", start: 540, end: 600 },
        { day: "Tue", start: 840, end: 900 },
      ];
      expect(freeTime(meetings)).toBe("No gaps between classes");
    });

    it("treats overlapping meetings as one stretch of class", () => {
      // 9:00–10:30 and 9:30–10:00 overlap; the next class starts at 11:00, 30 min after the first ends.
      const meetings: Meeting[] = [
        { day: "Thu", start: 540, end: 630 },
        { day: "Thu", start: 570, end: 600 },
        { day: "Thu", start: 660, end: 710 },
      ];
      expect(freeTime(meetings)).toBe("30 min free between classes");
    });

    it("gives the same badges as the score would", () => {
      for (const preset of ["bestOverall", "fewestGaps", "fewestDays"] as const) {
        expect(badges(fullWeek, preset)).toEqual(badges(fullWeek, preset, fullWeekFree));
      }
    });
  });

  describe("lead badge for each sort order", () => {
    it("latestStart → Start first", () => {
      expect(badges(fullWeek, "latestStart", fullWeekFree)[0]).toBe("Starts 9 AM");
    });

    it("fewestEarly → Start first", () => {
      expect(badges(fullWeek, "fewestEarly", fullWeekFree)[0]).toBe("Starts 9 AM");
    });

    it("earliestFinish → Finish first", () => {
      expect(badges(fullWeek, "earliestFinish", fullWeekFree)[0]).toBe("Done by 3 PM");
    });

    it("fewestDays → Days off first", () => {
      // Need days off for it to show. Classes only Mon and Tue.
      const meetings: Meeting[] = [
        { day: "Mon", start: 540, end: 600 },
        { day: "Tue", start: 540, end: 600 },
      ];
      expect(badges(meetings, "fewestDays", 0)[0]).toBe("3 days off");
    });

    it("fewestGaps → free time first", () => {
      expect(badges(fullWeek, "fewestGaps", fullWeekFree)).toEqual(["20 h free between classes", "Starts 9 AM", "Done by 3 PM"]);
      expect(badges(fullWeek, "fewestGaps", 0)[0]).toBe("No gaps between classes");
    });

    it("bestOverall has no lead badge, uses default order", () => {
      // Full week: no days off, so default order DaysOff(skip), Start, free time, Finish.
      expect(badges(fullWeek, "bestOverall", fullWeekFree)).toEqual(["Starts 9 AM", "20 h free between classes", "Done by 3 PM"]);
    });

    it("keeps free time third after Days off and Start", () => {
      const meetings: Meeting[] = [
        { day: "Mon", start: 540, end: 600 },
        { day: "Mon", start: 640, end: 700 },
      ];
      expect(badges(meetings, "bestOverall", 40)).toEqual(["4 days off", "Starts 9 AM", "40 min free between classes"]);
      expect(badges(meetings, "latestStart", 40)).toEqual(["Starts 9 AM", "4 days off", "40 min free between classes"]);
      expect(badges(meetings, "earliestFinish", 40)).toEqual(["Done by 11:40 AM", "4 days off", "Starts 9 AM"]);
    });
  });

  describe("cap of 3", () => {
    it("returns at most 3 badges", () => {
      // Classes only on Mon → 4 days off, with a break.
      // All four badge types apply: DaysOff, Start, free time, Finish.
      const meetings: Meeting[] = [
        { day: "Mon", start: 540, end: 600 },
        { day: "Mon", start: 840, end: 900 },
      ];
      expect(badges(meetings, "bestOverall", 240)).toHaveLength(3);
    });
  });

  describe("empty badges left out", () => {
    it("skips Days off when all weekdays have a class", () => {
      const result = badges(fullWeek, "bestOverall", fullWeekFree);
      expect(result.every((badge) => !badge.includes("off"))).toBe(true);
    });

    it("skips Days off when fewestDays is lead but no day is free", () => {
      const result = badges(fullWeek, "fewestDays", fullWeekFree);
      // DaysOff is lead but empty, so it's skipped. Next in default order.
      expect(result[0]).not.toContain("off");
    });
  });

  describe("empty week", () => {
    it("returns no badges for an empty meetings array", () => {
      expect(badges([], "bestOverall", 0)).toEqual([]);
      expect(badges([])).toEqual([]);
    });
  });
});

describe("scheduleBadgeDetails", () => {
  const week: Meeting[] = [
    { day: "Mon", start: 480, end: 530 },
    { day: "Mon", start: 600, end: 650 },
    { day: "Wed", start: 480, end: 830 },
  ];

  function tones(preset: SortPresetId = "bestOverall", startsAfter = 0) {
    return scheduleBadgeDetails(week, {}, preset, startsAfter).map(({ text, tone, lead }) => ({ text, tone, lead }));
  }

  it("warns about an 8 AM start and marks good news green", () => {
    expect(tones()).toEqual([
      { text: "3 days off", tone: "good", lead: false },
      { text: "Starts 8 AM", tone: "warning", lead: false },
      { text: "1 h free between classes", tone: "good", lead: false },
    ]);
  });

  it("says when the start is early, for screen readers", () => {
    const start = scheduleBadgeDetails(week, {}, "bestOverall", 0).find((badge) => badge.text === "Starts 8 AM");
    expect(start?.note).toBe("before 9 AM");
  });

  it("measures an early start against Starts after when it's set", () => {
    const later: Meeting[] = [{ day: "Mon", start: 570, end: 620 }];
    expect(scheduleBadgeDetails(later, {}, "latestStart", 0)[0]).toMatchObject({ text: "Starts 9:30 AM", tone: "plain" });
    expect(scheduleBadgeDetails(later, {}, "latestStart", 600)[0]).toMatchObject({ text: "Starts 9:30 AM", tone: "warning", note: "before 10 AM" });
  });

  it("highlights only the badge the sort ranks by", () => {
    expect(tones("earliestFinish").filter((badge) => badge.lead)).toEqual([{ text: "Done by 1:50 PM", tone: "good", lead: true }]);
    expect(tones("bestOverall").some((badge) => badge.lead)).toBe(false);
  });

  it("keeps a late finish and no gaps plain", () => {
    const long: Meeting[] = [{ day: "Mon", start: 600, end: 1080 }];
    const finish = scheduleBadgeDetails(long, { freeMinutes: 0 }, "earliestFinish", 0);
    const gaps = scheduleBadgeDetails(long, { freeMinutes: 0 }, "fewestGaps", 0);
    expect(finish.find((badge) => badge.text === "Done by 6 PM")?.tone).toBe("plain");
    expect(gaps.find((badge) => badge.text === "No gaps between classes")?.tone).toBe("plain");
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
