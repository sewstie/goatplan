import { describe, expect, it } from "vitest";
import type { BlockedTime } from "@/lib/engine/types";
import { addBlocked, groupBlocked, groupDays, groupTimes, removeGroup } from "./blockedTimes";

const work: BlockedTime[] = [
  { day: "Fri", start: 840, end: 960 },
  { day: "Tue", start: 840, end: 960 },
];

describe("groupBlocked", () => {
  it("puts days with the same range in one group, in week order", () => {
    const [group] = groupBlocked(work);
    expect(group).toEqual({ start: 840, end: 960, days: ["Tue", "Fri"] });
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
  it("adds one entry per day", () => {
    expect(addBlocked([], ["Thu", "Mon"], 720, 780)).toEqual([
      { day: "Mon", start: 720, end: 780 },
      { day: "Thu", start: 720, end: 780 },
    ]);
  });

  it("skips days that already block exactly that range", () => {
    const result = addBlocked(work, ["Tue", "Wed"], 840, 960);
    expect(result).toEqual([...work, { day: "Wed", start: 840, end: 960 }]);
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
});
