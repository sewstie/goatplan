import { describe, expect, it } from "vitest";
import { WEEK } from "@/lib/data/days";
import { calendarBounds } from "./calendarBounds";
import { solved, term } from "./testing/plannerFixtures";

describe("calendarBounds", () => {
  it("uses 8 AM–5 PM for an empty plan", () => {
    expect(calendarBounds(null, [], [])).toEqual({ range: { start: 480, end: 1020 }, days: WEEK.slice(0, 5) });
  });

  it("includes a late class found only in schedule 2", () => {
    const data = structuredClone(term);
    data.courses[0].sections.find((section) => section.code === "CX02")!.meetings = [
      { days: ["Fri"], start: 1080, end: 1130, location: "" },
    ];
    const schedules = solved(["CX01", "CX02"]).schedules;
    expect(calendarBounds(data, schedules.slice(0, 1), []).range).toEqual({ start: 480, end: 1020 });
    expect(calendarBounds(data, schedules, []).range).toEqual({ start: 480, end: 1140 });
  });

  it("includes blocked times even without a schedule", () => {
    expect(calendarBounds(null, [], [{ day: "Tue", start: 1080, end: 1200 }]).range)
      .toEqual({ start: 480, end: 1200 });
  });

  it("fits preview blocks and switches to seven days for weekend previews or blocked times", () => {
    const preview = { day: "Sun" as const, start: 450, end: 500 };
    expect(calendarBounds(term, [], [], [preview])).toEqual({ range: { start: 420, end: 1020 }, days: WEEK });
    expect(calendarBounds(term, [], [preview]).days).toEqual(WEEK);
  });

  it("keeps seven days for a weekend class found only in another schedule", () => {
    const data = structuredClone(term);
    data.courses[0].sections.find((section) => section.code === "CX02")!.meetings[0].days = ["Sat"];
    expect(calendarBounds(data, solved(["CX01", "CX02"]).schedules, []).days).toEqual(WEEK);
  });
});
