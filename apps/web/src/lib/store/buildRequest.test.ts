import { describe, expect, it } from "vitest";
import { buildRequest, MAX_SCHEDULES } from "./buildRequest";
import { emptyDraft } from "./draft";
import { SORT_PRESETS, SORT_PRESET_IDS, isSortPresetId } from "./sortPresets";
import type { Draft, SortPresetId } from "./types";
import { termFile } from "./testing/fixtures";

const plan = (changes: Partial<Draft>): Draft => ({ ...emptyDraft(), ...changes });

/** Best overall's weights (docs/engine-api.md); every sort sends them, so score.total means the same everywhere. */
const BEST_OVERALL_WEIGHTS = { earlyCutoff: 600, perEarlyMinute: 3, perGapMinute: 1, perDay: 60, lateCutoff: 1440, perLateMinute: 0 };

describe("buildRequest", () => {
  it("allows every matching lecture and co-taught lecture without allowing a matching lab", () => {
    const term = termFile("2027-C");
    const course = term.courses[0];
    course.sections[0].instructors = ["Ye Lu"];
    course.sections[1].instructors = ["Someone Else"];
    course.sections[2].instructors = ["Alex Smith", "YE LU"];
    course.sections.push({ ...course.sections[0], id: "AE 2320-CL02", code: "CL02", instructors: [" ye lu "] });
    course.sections.push({ ...course.sections[0], id: "AE 2320-CL03", code: "CL03", instructors: ["Alex Smith", " YE LU "] });
    course.sections.push({ ...course.sections[0], id: "AE 2320-CL04", code: "CL04", instructors: ["Someone Else"] });
    const request = buildRequest({
      ...plan({ courses: ["AE 2320", "AE 2410"], professorByCourse: { "AE 2320": "yE lU", "AE 2410": null, "AB 1533": "Ye Lu" } }),
      term,
    });
    expect(request?.preferences?.anyOf).toEqual({ "AE 2320": ["AE 2320-CL01", "AE 2320-CL02", "AE 2320-CL03"] });
  });

  it("keeps unmatched full names identifiable for frontend validation", () => {
    const term = termFile("2027-C");
    expect(buildRequest({ ...plan({ courses: ["AE 2320"], professorByCourse: { "AE 2320": "Lu" } }), term })?.preferences?.anyOf)
      .toEqual({ "AE 2320": [] });
    expect(buildRequest({ ...plan({ courses: ["AE 2320"], professorByCourse: { "AE 2320": null } }), term })?.preferences?.anyOf)
      .toEqual({});
  });

  it("returns null when there are no courses, since the engine needs at least one", () => {
    expect(buildRequest(plan({}))).toBeNull();
  });

  it("builds a version 1 request with every preference, the sort weights and the schedule limit", () => {
    const request = buildRequest(
      plan({
        courses: ["AE 2320", "AE 2410"],
        preferences: { startsAfter: 600, blocked: [{ day: "Tue", start: 840, end: 960 }], onlyOpen: false },
        sortPreset: "fewestDays",
      }),
    );
    expect(request).toEqual({
      version: 1,
      courses: ["AE 2320", "AE 2410"],
      preferences: {
        startsAfter: 600,
        blocked: [{ day: "Tue", start: 840, end: 960 }],
        onlyOpen: false,
        locked: {},
        anyOf: {},
      },
      sort: { ...BEST_OVERALL_WEIGHTS, primary: "days" },
      limits: { maxSchedules: MAX_SCHEDULES },
    });
  });

  it("leaves the names of blocked times out of the request", () => {
    const request = buildRequest(
      plan({
        courses: ["AE 2320"],
        preferences: { startsAfter: 540, blocked: [{ day: "Tue", start: 840, end: 960, label: "Work" }], onlyOpen: true },
      }),
    );
    expect(request?.preferences?.blocked).toEqual([{ day: "Tue", start: 840, end: 960 }]);
  });

  it("drops repeated courses", () => {
    expect(buildRequest(plan({ courses: ["AE 2320", "AE 2320", "AE 2410"] }))?.courses).toEqual(["AE 2320", "AE 2410"]);
  });

  it("only sends locks for courses in the plan that have something locked", () => {
    const request = buildRequest(
      plan({
        courses: ["AE 2320", "AE 2410"],
        locks: {
          "AE 2320": ["AE 2320-CX02", "AE 2320-CX02"],
          "AE 2410": [],
          "AB 1533": ["AB 1533-C01"],
        },
      }),
    );
    expect(request?.preferences?.locked).toEqual({ "AE 2320": ["AE 2320-CX02"] });
  });

  it("doesn't share objects with the state it was built from", () => {
    const draft = plan({ courses: ["AE 2320"], preferences: { startsAfter: 0, blocked: [{ day: "Mon", start: 1, end: 2 }], onlyOpen: true } });
    const request = buildRequest(draft)!;
    request.preferences!.blocked![0].start = 99;
    request.sort!.perDay = 1;
    expect(draft.preferences.blocked[0].start).toBe(1);
    expect(buildRequest(draft)?.sort).toEqual(BEST_OVERALL_WEIGHTS);
  });
});

describe("sort presets", () => {
  it("names each preset's label, description and primary measure, in menu order", () => {
    expect(SORT_PRESET_IDS).toEqual(["bestOverall", "fewestEarly", "latestStart", "earliestFinish", "fewestDays", "fewestGaps"]);
    expect(SORT_PRESETS).toEqual({
      bestOverall: { label: "Best overall", description: "A balance of start time, gaps and days", primary: null },
      fewestEarly: { label: "Fewest early classes", description: "Fewer classes before 10 AM", primary: "earlyMinutes" },
      latestStart: { label: "Latest start", description: "Classes start as late as possible each day", primary: "firstStart" },
      earliestFinish: { label: "Earliest finish", description: "Classes end as early as possible each day", primary: "lastEnd" },
      fewestDays: { label: "Most days off", description: "Fewer days on campus", primary: "days" },
      fewestGaps: { label: "Most compact", description: "Less free time between classes", primary: "freeMinutes" },
    });
  });

  it.each([
    ["fewestEarly", "earlyMinutes"],
    ["latestStart", "firstStart"],
    ["earliestFinish", "lastEnd"],
    ["fewestDays", "days"],
    ["fewestGaps", "freeMinutes"],
  ] as const)("%s sends the Best overall weights and ranks by %s first", (id, primary) => {
    expect(buildRequest(plan({ courses: ["AE 2320"], sortPreset: id }))?.sort).toEqual({ ...BEST_OVERALL_WEIGHTS, primary });
  });

  it("Best overall sends its weights and no primary measure, and new drafts use it", () => {
    const draft = emptyDraft();
    expect(draft.sortPreset).toBe("bestOverall");
    const sort = buildRequest({ ...draft, courses: ["AE 2320"] })?.sort;
    expect(sort).toEqual(BEST_OVERALL_WEIGHTS);
    expect(sort).not.toHaveProperty("primary");
  });

  it("keeps a stored draft's preset ID as it is", () => {
    for (const id of ["fewestEarly", "fewestGaps", "fewestDays", "latestStart", "earliestFinish", "bestOverall"] as SortPresetId[]) {
      expect(isSortPresetId(id)).toBe(true);
      expect(buildRequest(plan({ courses: ["AE 2320"], sortPreset: id }))?.sort?.primary ?? null).toBe(SORT_PRESETS[id].primary);
    }
  });

  it("rejects unknown preset IDs", () => {
    expect(isSortPresetId("random")).toBe(false);
    expect(isSortPresetId("")).toBe(false);
    expect(isSortPresetId(null)).toBe(false);
  });
});
