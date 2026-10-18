import { describe, expect, it } from "vitest";
import { findSchedule, scheduleKey, selectChosenSections, selectCurrentSchedule, selectSchedules } from "./selectors";
import { solved } from "./testing/fixtures";

const response = solved({ version: 1, courses: ["AE 2320", "AE 2410"] });

describe("selectors", () => {
  it("lists the schedules of a successful response only", () => {
    expect(selectSchedules({ response })).toHaveLength(2);
    expect(selectSchedules({ response: null })).toEqual([]);
    const error = { ok: false as const, version: 1 as const, error: { code: "noTerm" as const, message: "", detail: null } };
    expect(selectSchedules({ response: error })).toEqual([]);
  });

  it("returns the same empty list every time, so React doesn't re-render", () => {
    expect(selectSchedules({ response: null })).toBe(selectSchedules({ response: null }));
  });

  it("picks the current schedule by index", () => {
    expect(selectCurrentSchedule({ response, scheduleIndex: 1 })).toBe(response.ok && response.schedules[1]);
    expect(selectCurrentSchedule({ response, scheduleIndex: 5 })).toBeNull();
  });

  it("keys a schedule by its shown sections", () => {
    const schedule = response.ok ? response.schedules[0] : null;
    expect(scheduleKey(schedule!)).toBe("AE 2320-CL01+AE 2320-CX01|AE 2410-C01");
  });

  it("uses the picked alternative when it's one of the schedule's alternatives", () => {
    const key = "AE 2320-CL01+AE 2320-CX01|AE 2410-C01";
    const state = {
      response,
      scheduleIndex: 0,
      alternatives: { [key]: { "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"], "AE 2410": ["AE 2410-C99"] } },
    };
    expect(selectChosenSections(state)).toEqual({
      "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"],
      "AE 2410": ["AE 2410-C01"],
    });
    expect(selectChosenSections({ ...state, response: null })).toEqual({});
  });

  it("finds the first schedule that can show the wanted sections, with the alternatives to pick", () => {
    const schedules = response.ok ? response.schedules : [];
    const lab = (id: string) => ({ "AE 2320": ["AE 2320-CL01", `AE 2320-${id}`], "AE 2410": ["AE 2410-C01"] });
    expect(findSchedule(schedules, lab("CX01"))).toEqual({ index: 0, choices: {} });
    expect(findSchedule(schedules, lab("CX02"))).toEqual({
      index: 0,
      choices: { "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"] },
    });
    expect(findSchedule(schedules.slice(1), { ...lab("CX01"), "AE 2320": ["AE 2320-CX01", "AE 2320-CL01"] })).toEqual({
      index: 0,
      choices: { "AE 2320": ["AE 2320-CL01", "AE 2320-CX01"] },
    });
    expect(findSchedule(schedules, lab("CX03"))).toBeNull();
    expect(findSchedule(schedules, { "AE 2320": ["AE 2320-CL01", "AE 2320-CX01"] })).toBeNull();
  });
});
