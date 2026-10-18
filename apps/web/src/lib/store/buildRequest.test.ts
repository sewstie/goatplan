import { describe, expect, it } from "vitest";
import { buildRequest, MAX_SCHEDULES } from "./buildRequest";
import { emptyDraft } from "./draft";
import { SORT_PRESETS } from "./sortPresets";
import type { Draft } from "./types";

const plan = (changes: Partial<Draft>): Draft => ({ ...emptyDraft(), ...changes });

describe("buildRequest", () => {
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
