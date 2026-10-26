import { describe, expect, it } from "vitest";
import { SORT_PRESETS, SORT_PRESET_IDS } from "@/lib/store/sortPresets";
import type { SortPresetId } from "@/lib/store/types";
import { scheduleBadges, type BadgeMeeting } from "@/components/schedule/scheduleCopy";

/**
 * Ticket 05: Honest sorting end to end.
 *
 * Verifies the sort presets, their descriptions, the leading badge for each sort, and
 * that the read-only sort chip shows the label (tested in ReadOnlyPreferences.test.tsx).
 */

describe("ticket 05: sort menu labels and descriptions", () => {
  it("has six presets in the correct order", () => {
    expect(SORT_PRESET_IDS).toHaveLength(6);
    expect(SORT_PRESET_IDS).toEqual([
      "bestOverall",
      "fewestEarly",
      "latestStart",
      "earliestFinish",
      "fewestDays",
      "fewestGaps",
    ]);
  });

  it("Latest start description is 'Classes start as late as possible each day'", () => {
    expect(SORT_PRESETS.latestStart.description).toBe("Classes start as late as possible each day");
  });

  it("Earliest finish description is 'Classes end as early as possible each day'", () => {
    expect(SORT_PRESETS.earliestFinish.description).toBe("Classes end as early as possible each day");
  });

  it("every preset has a non-empty label and description", () => {
    for (const id of SORT_PRESET_IDS) {
      const preset = SORT_PRESETS[id];
      expect(preset.label).toBeTruthy();
      expect(preset.description).toBeTruthy();
    }
  });
});

describe("ticket 05: leading badge correctness", () => {
  // A schedule with classes Mon/Wed 9 AM–10 AM and Fri 2 PM–3 PM.
  // Has days off (Tue, Thu), a start (9 AM), a finish (3 PM), and gaps.
  const meetings: BadgeMeeting[] = [
    { day: "Mon", start: 540, end: 600 },
    { day: "Mon", start: 840, end: 900 },
    { day: "Wed", start: 540, end: 600 },
    { day: "Fri", start: 840, end: 900 },
  ];

  const EXPECTED_LEAD: [SortPresetId, RegExp][] = [
    ["latestStart", /^Starts /],
    ["fewestEarly", /^Starts /],
    ["earliestFinish", /^Done by /],
    ["fewestDays", /off$/],
    ["fewestGaps", /gap/],
  ];

  it.each(EXPECTED_LEAD)("%s has its primary-measure badge first", (preset, pattern) => {
    const badges = scheduleBadges(meetings, preset);
    expect(badges.length).toBeGreaterThan(0);
    expect(badges[0]).toMatch(pattern);
  });

  it("bestOverall has no forced lead badge", () => {
    const badges = scheduleBadges(meetings, "bestOverall");
    // Default order: DaysOff (if any), Start, Gaps, Finish
    expect(badges.length).toBeLessThanOrEqual(3);
    // First badge is days off because there are free days
    expect(badges[0]).toMatch(/off$/);
  });

  it("on #1 the lead badge is at least as good as on #2", () => {
    // Two schedules: schedule A starts at 11 AM, schedule B starts at 9 AM.
    // Under latestStart, A should be #1 (later start is better).
    const scheduleA: BadgeMeeting[] = [{ day: "Mon", start: 660, end: 720 }];
    const scheduleB: BadgeMeeting[] = [{ day: "Mon", start: 540, end: 600 }];

    const badgesA = scheduleBadges(scheduleA, "latestStart");
    const badgesB = scheduleBadges(scheduleB, "latestStart");

    // Both lead with Start
    expect(badgesA[0]).toMatch(/^Starts /);
    expect(badgesB[0]).toMatch(/^Starts /);

    // Parse the times: "Starts 11 AM" → 660, "Starts 9 AM" → 540
    const timeA = parseStartTime(badgesA[0]);
    const timeB = parseStartTime(badgesB[0]);
    expect(timeA).toBeGreaterThanOrEqual(timeB);
  });

  it("earliestFinish: #1 finishes no later than #2", () => {
    const scheduleA: BadgeMeeting[] = [{ day: "Mon", start: 540, end: 600 }]; // Done by 10 AM
    const scheduleB: BadgeMeeting[] = [{ day: "Mon", start: 540, end: 900 }]; // Done by 3 PM

    const badgesA = scheduleBadges(scheduleA, "earliestFinish");
    const badgesB = scheduleBadges(scheduleB, "earliestFinish");

    expect(badgesA[0]).toMatch(/^Done by /);
    expect(badgesB[0]).toMatch(/^Done by /);

    const timeA = parseFinishTime(badgesA[0]);
    const timeB = parseFinishTime(badgesB[0]);
    expect(timeA).toBeLessThanOrEqual(timeB);
  });

  it("fewestDays: #1 has at least as many days off as #2", () => {
    const scheduleA: BadgeMeeting[] = [{ day: "Mon", start: 540, end: 600 }]; // 4 days off
    const scheduleB: BadgeMeeting[] = [
      { day: "Mon", start: 540, end: 600 },
      { day: "Tue", start: 540, end: 600 },
      { day: "Wed", start: 540, end: 600 },
    ]; // 2 days off

    const badgesA = scheduleBadges(scheduleA, "fewestDays");
    const badgesB = scheduleBadges(scheduleB, "fewestDays");

    expect(badgesA[0]).toMatch(/off$/);
    expect(badgesB[0]).toMatch(/off$/);

    const daysOffA = parseDaysOff(badgesA[0]);
    const daysOffB = parseDaysOff(badgesB[0]);
    expect(daysOffA).toBeGreaterThanOrEqual(daysOffB);
  });
});

describe("ticket 05: sort presets have correct primary measures", () => {
  it.each([
    ["bestOverall", null],
    ["fewestEarly", "earlyMinutes"],
    ["latestStart", "firstStart"],
    ["earliestFinish", "lastEnd"],
    ["fewestDays", "days"],
    ["fewestGaps", "freeMinutes"],
  ] as const)("%s has primary %s", (id, expected) => {
    expect(SORT_PRESETS[id].primary).toBe(expected);
  });
});

// Helpers to parse badge text into comparable values.

function parseStartTime(badge: string): number {
  const match = badge.match(/Starts (\d{1,2})(?::(\d{2}))? (AM|PM)/);
  if (!match) throw new Error(`Cannot parse start time from "${badge}"`);
  return ((Number(match[1]) % 12) + (match[3] === "PM" ? 12 : 0)) * 60 + Number(match[2] ?? 0);
}

function parseFinishTime(badge: string): number {
  const match = badge.match(/Done by (\d{1,2})(?::(\d{2}))? (AM|PM)/);
  if (!match) throw new Error(`Cannot parse finish time from "${badge}"`);
  return ((Number(match[1]) % 12) + (match[3] === "PM" ? 12 : 0)) * 60 + Number(match[2] ?? 0);
}

function parseDaysOff(badge: string): number {
  if (badge.match(/^\d+ days off$/)) return Number(badge.match(/^(\d+)/)?.[1]);
  if (badge.match(/,/)) return 2; // "Tue, Thu off"
  if (badge.match(/off$/)) return 1; // "Fri off"
  return 0;
}
