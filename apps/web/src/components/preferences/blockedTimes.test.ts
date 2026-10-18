import { describe, expect, it } from "vitest";
import type { PlanBlockedTime } from "@/lib/store";
import { addBlocked, groupBlocked, groupDays, groupTimes, removeGroup } from "./blockedTimes";

const work: PlanBlockedTime[] = [
  { day: "Fri", start: 840, end: 960 },
  { day: "Tue", start: 840, end: 960 },
];

const named = (label: string, times: PlanBlockedTime[]) => times.map((time) => ({ ...time, label }));

describe("groupBlocked", () => {
  it("puts days with the same range in one group, in week order", () => {
    const [group] = groupBlocked(work);
    expect(group).toEqual({ label: null, start: 840, end: 960, days: ["Tue", "Fri"] });
    expect(groupDays(group)).toBe("Tue, Fri");
    expect(groupTimes(group)).toBe("2 PM–4 PM");
  });

  it("keeps different ranges apart, in the order they were added", () => {
    const groups = groupBlocked([...work, { day: "Mon", start: 720, end: 780 }, { day: "Wed", start: 840, end: 960 }]);
    expect(groups.map((group) => [groupDays(group), groupTimes(group)])).toEqual([
      ["Tue, Wed, Fri", "2 PM–4 PM"],
      ["Mon", "12 PM–1 PM"],
    ]);
  });

  it("keeps the name, and splits the same range with different names", () => {
    const groups = groupBlocked([...named("Work", work), { day: "Thu", start: 840, end: 960, label: "Gym" }]);
    expect(groups.map((group) => [group.label, groupDays(group)])).toEqual([
      ["Work", "Tue, Fri"],
      ["Gym", "Thu"],
    ]);
  });

  it("treats a blank name as no name", () => {
    expect(groupBlocked([{ day: "Mon", start: 720, end: 780, label: "  " }])[0].label).toBeNull();
  });

  it("collapses three or more days in a row", () => {
    const days = (["Mon", "Tue", "Wed", "Thu", "Fri"] as const).map((day) => ({ day, start: 510, end: 600 }));
    const [group] = groupBlocked(days);
    expect(groupDays(group)).toBe("Mon–Fri");
    expect(groupTimes(group)).toBe("8:30 AM–10 AM");
  });

  it("returns nothing for no blocked times", () => {
    expect(groupBlocked([])).toEqual([]);
  });
});

describe("addBlocked", () => {
  it("adds one entry per day, without a name by default", () => {
    expect(addBlocked([], ["Thu", "Mon"], 720, 780)).toEqual([
      { day: "Mon", start: 720, end: 780 },
      { day: "Thu", start: 720, end: 780 },
    ]);
  });

  it("adds the name, trimmed", () => {
    expect(addBlocked([], ["Tue"], 840, 960, "  Work ")).toEqual([{ day: "Tue", start: 840, end: 960, label: "Work" }]);
  });

  it("renames a day that already blocks exactly that range instead of adding it twice", () => {
    const result = addBlocked(work, ["Tue", "Wed"], 840, 960, "Work");
    expect(result).toEqual([
      { day: "Fri", start: 840, end: 960 },
      { day: "Tue", start: 840, end: 960, label: "Work" },
      { day: "Wed", start: 840, end: 960, label: "Work" },
    ]);
  });

  it("keeps an overlapping but different range", () => {
    expect(addBlocked(work, ["Tue"], 900, 1000)).toHaveLength(3);
  });

  it("doesn't change the list it was given", () => {
    const before = [...work];
    addBlocked(work, ["Mon"], 600, 660);
    expect(work).toEqual(before);
  });
});

describe("removeGroup", () => {
  it("removes every day of the group and nothing else", () => {
    const lunch = { day: "Mon" as const, start: 720, end: 780 };
    const [workGroup] = groupBlocked(work);
    expect(removeGroup([...work, lunch], workGroup)).toEqual([lunch]);
  });

  it("leaves a group with the same range but another name", () => {
    const gym = { day: "Thu" as const, start: 840, end: 960, label: "Gym" };
    const [workGroup] = groupBlocked(named("Work", work));
    expect(removeGroup([...named("Work", work), gym], workGroup)).toEqual([gym]);
  });
});
