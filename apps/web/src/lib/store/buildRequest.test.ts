import { describe, expect, it } from "vitest";
import { buildRequest, MAX_SCHEDULES } from "./buildRequest";
import { emptyDraft } from "./draft";
import { SORT_PRESETS, SORT_PRESET_IDS, isSortPresetId } from "./sortPresets";
import type { Draft, SortPresetId } from "./types";
import { termFile } from "./testing/fixtures";

const plan = (changes: Partial<Draft>): Draft => ({ ...emptyDraft(), ...changes });

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
      sort: SORT_PRESETS.fewestDays.weights,
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
    expect(SORT_PRESETS.fewestEarly.weights.perDay).toBe(20);
  });
});

describe("sort presets", () => {
  it.each(SORT_PRESET_IDS)("preset %s sends its full weights including late fields", (id) => {
    const request = buildRequest(plan({ courses: ["AE 2320"], sortPreset: id }));
    const weights = SORT_PRESETS[id].weights;
    expect(request?.sort).toEqual(weights);
    expect(request?.sort).toHaveProperty("lateCutoff");
    expect(request?.sort).toHaveProperty("perLateMinute");
    expect(typeof request?.sort?.lateCutoff).toBe("number");
    expect(typeof request?.sort?.perLateMinute).toBe("number");
  });

  it("new drafts use bestOverall", () => {
    const draft = emptyDraft();
    expect(draft.sortPreset).toBe("bestOverall");
    const request = buildRequest({ ...draft, courses: ["AE 2320"] });
    expect(request?.sort).toEqual(SORT_PRESETS.bestOverall.weights);
  });

  it("a stored draft with an older preset ID is kept", () => {
    const olderIds: SortPresetId[] = ["fewestEarly", "fewestGaps", "fewestDays"];
    for (const id of olderIds) {
      expect(isSortPresetId(id)).toBe(true);
      const request = buildRequest(plan({ courses: ["AE 2320"], sortPreset: id }));
      expect(request?.sort).toEqual(SORT_PRESETS[id].weights);
    }
  });

  it("new preset IDs pass the preset-ID check", () => {
    const newIds: SortPresetId[] = ["bestOverall", "latestStart", "earliestFinish"];
    for (const id of newIds) {
      expect(isSortPresetId(id)).toBe(true);
    }
  });

  it("rejects unknown preset IDs", () => {
    expect(isSortPresetId("random")).toBe(false);
    expect(isSortPresetId("")).toBe(false);
    expect(isSortPresetId(null)).toBe(false);
  });

  it("has six presets in menu order", () => {
    expect(SORT_PRESET_IDS).toEqual([
      "bestOverall",
      "fewestEarly",
      "latestStart",
      "earliestFinish",
      "fewestDays",
      "fewestGaps",
    ]);
  });

  it("tie-break: every preset except bestOverall has every weight above 0 and its main term higher than in bestOverall", () => {
    const overall = SORT_PRESETS.bestOverall.weights;

    // The main term for each specialized preset
    const mainTerm: Record<Exclude<SortPresetId, "bestOverall">, keyof typeof overall> = {
      fewestEarly: "perEarlyMinute",
      latestStart: "perEarlyMinute",
      earliestFinish: "perLateMinute",
      fewestDays: "perDay",
      fewestGaps: "perGapMinute",
    };

    // The weight terms that contribute to the score (late pair only when lateCutoff < 1440)
    const activeWeightKeys = (w: Required<typeof overall>) => {
      const keys: (keyof typeof overall)[] = ["perEarlyMinute", "perGapMinute", "perDay"];
      if ((w.lateCutoff ?? 1440) < 1440) keys.push("perLateMinute");
      return keys;
    };

    for (const id of SORT_PRESET_IDS) {
      if (id === "bestOverall") continue;
      const weights = SORT_PRESETS[id].weights;

      // Every active weight term is above 0
      for (const key of activeWeightKeys(weights)) {
        expect(weights[key], `${id}.${key} should be > 0`).toBeGreaterThan(0);
      }

      // Its main term weighs more than in Best overall
      const key = mainTerm[id];
      expect(weights[key], `${id}.${key} should be > bestOverall.${key} (${overall[key]})`).toBeGreaterThan(overall[key]!);
    }
  });
});
