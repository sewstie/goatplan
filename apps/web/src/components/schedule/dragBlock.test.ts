import { describe, expect, it } from "vitest";
import type { Day } from "@/lib/data/types";
import { addRanges, blockedAt, changedDays, changeText, dayIndexAt, dayRanges, mergeBlocked, minuteAt, selectionText, snapRange, subtractBlocked } from "./dragBlock";

const RANGE = { start: 480, end: 1020 };
const WEEKDAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

describe("minuteAt", () => {
  it("turns a pointer height in the grid into minutes, clamped to the visible range", () => {
    expect(minuteAt(100, 100, 540, RANGE)).toBe(480);
    expect(minuteAt(370, 100, 540, RANGE)).toBe(750);
    expect(minuteAt(20, 100, 540, RANGE)).toBe(480);
    expect(minuteAt(900, 100, 540, RANGE)).toBe(1020);
  });
});

describe("snapRange", () => {
  it("covers every half hour the drag touched, whichever way it went", () => {
    expect(snapRange(730, 770, RANGE)).toEqual({ start: 720, end: 780 });
    expect(snapRange(770, 730, RANGE)).toEqual({ start: 720, end: 780 });
  });

  it("is at least 30 minutes long", () => {
    expect(snapRange(730, 731, RANGE)).toEqual({ start: 720, end: 750 });
    expect(snapRange(720, 720, RANGE)).toEqual({ start: 720, end: 750 });
  });

  it("stays inside the visible range at both edges", () => {
    expect(snapRange(1020, 1020, RANGE)).toEqual({ start: 990, end: 1020 });
    expect(snapRange(1010, 1020, RANGE)).toEqual({ start: 990, end: 1020 });
    expect(snapRange(550, 480, RANGE)).toEqual({ start: 480, end: 570 });
    expect(snapRange(480, 480, RANGE)).toEqual({ start: 480, end: 510 });
  });
});

describe("dayIndexAt", () => {
  const columns = [100, 200, 300].map((left) => ({ left, right: left + 100 }));

  it("finds the column under the pointer, or the nearest one when it's past either side", () => {
    expect(dayIndexAt(150, columns)).toBe(0);
    expect(dayIndexAt(250, columns)).toBe(1);
    expect(dayIndexAt(40, columns)).toBe(0);
    expect(dayIndexAt(900, columns)).toBe(2);
  });
});

describe("dayRanges", () => {
  it("gives every day the rectangle spans the same time, whichever way it was drawn", () => {
    const expected = [
      { day: "Mon", start: 720, end: 780 },
      { day: "Tue", start: 720, end: 780 },
      { day: "Wed", start: 720, end: 780 },
    ];
    expect(dayRanges(WEEKDAYS, 0, 2, { start: 720, end: 780 })).toEqual(expected);
    expect(dayRanges(WEEKDAYS, 2, 0, { start: 720, end: 780 })).toEqual(expected);
    expect(dayRanges(WEEKDAYS, 4, 4, { start: 600, end: 630 })).toEqual([{ day: "Fri", start: 600, end: 630 }]);
  });
});

describe("mergeBlocked", () => {
  it("joins blocks on the same day with the same name that overlap or touch, in place of the first", () => {
    expect(
      mergeBlocked([
        { day: "Tue", start: 840, end: 960, label: "Work" },
        { day: "Mon", start: 720, end: 780 },
        { day: "Mon", start: 780, end: 840 },
        { day: "Tue", start: 900, end: 1020, label: "Work" },
        { day: "Mon", start: 750, end: 810 },
      ]),
    ).toEqual([
      { day: "Tue", start: 840, end: 1020, label: "Work" },
      { day: "Mon", start: 720, end: 840 },
    ]);
  });

  it("keeps blocks apart when the name, the day or a gap tells them apart", () => {
    const blocked = [
      { day: "Mon" as const, start: 720, end: 780, label: "Work" },
      { day: "Mon" as const, start: 750, end: 810 },
      { day: "Tue" as const, start: 780, end: 840 },
      { day: "Mon" as const, start: 840, end: 870 },
    ];
    expect(mergeBlocked(blocked)).toEqual(blocked);
  });

  it("treats an empty name as no name", () => {
    expect(mergeBlocked([{ day: "Mon", start: 720, end: 780, label: " " }, { day: "Mon", start: 780, end: 810 }])).toEqual([
      { day: "Mon", start: 720, end: 810, label: " " },
    ]);
  });

  it("joins a block that runs past the visible range with one inside it", () => {
    expect(mergeBlocked([{ day: "Wed", start: 420, end: 540 }, { day: "Wed", start: 510, end: 600 }])).toEqual([
      { day: "Wed", start: 420, end: 600 },
    ]);
  });

  it("joins a chain that only connects through a later block", () => {
    expect(
      mergeBlocked([
        { day: "Mon", start: 600, end: 660 },
        { day: "Mon", start: 720, end: 780 },
        { day: "Mon", start: 660, end: 720 },
      ]),
    ).toEqual([{ day: "Mon", start: 600, end: 780 }]);
  });
});

describe("subtractBlocked", () => {
  const work = { day: "Mon" as const, start: 720, end: 900, label: "Work" };

  it("splits a block when only its middle is removed, keeping its name and place", () => {
    expect(subtractBlocked([work, { day: "Tue", start: 600, end: 660 }], [{ day: "Mon", start: 780, end: 840 }])).toEqual([
      { day: "Mon", start: 720, end: 780, label: "Work" },
      { day: "Mon", start: 840, end: 900, label: "Work" },
      { day: "Tue", start: 600, end: 660 },
    ]);
  });

  it("trims an end, drops a block that is fully covered and leaves other days alone", () => {
    const blocked = [work, { day: "Mon" as const, start: 600, end: 630 }, { day: "Wed" as const, start: 720, end: 780 }];
    expect(subtractBlocked(blocked, [{ day: "Mon", start: 570, end: 780 }, { day: "Tue", start: 570, end: 780 }])).toEqual([
      { day: "Mon", start: 780, end: 900, label: "Work" },
      { day: "Wed", start: 720, end: 780 },
    ]);
  });

  it("keeps the part of a block that runs past the visible range", () => {
    expect(subtractBlocked([{ day: "Thu", start: 420, end: 540 }], [{ day: "Thu", start: 480, end: 540 }])).toEqual([
      { day: "Thu", start: 420, end: 480 },
    ]);
  });
});

describe("addRanges", () => {
  it("adds the time to every day and joins it with unnamed blocks it touches", () => {
    const blocked = [{ day: "Mon" as const, start: 780, end: 840 }, { day: "Tue" as const, start: 750, end: 810, label: "Work" }];
    expect(addRanges(blocked, dayRanges(WEEKDAYS, 0, 2, { start: 720, end: 780 }))).toEqual([
      { day: "Mon", start: 720, end: 840 },
      { day: "Tue", start: 750, end: 810, label: "Work" },
      { day: "Tue", start: 720, end: 780 },
      { day: "Wed", start: 720, end: 780 },
    ]);
  });

  it("leaves a day alone, name and all, when that time is already blocked there", () => {
    const blocked = [{ day: "Mon" as const, start: 720, end: 780, label: "Work" }, { day: "Tue" as const, start: 690, end: 810, label: "Gym" }];
    expect(addRanges(blocked, dayRanges(WEEKDAYS, 0, 1, { start: 720, end: 780 }))).toEqual(blocked);
  });
});

describe("blockedAt", () => {
  it("says whether a press lands on a blocked time, so the drag erases instead", () => {
    const blocked = [{ day: "Mon" as const, start: 720, end: 780 }];
    expect(blockedAt(blocked, "Mon", 720)).toBe(true);
    expect(blockedAt(blocked, "Mon", 779.5)).toBe(true);
    expect(blockedAt(blocked, "Mon", 780)).toBe(false);
    expect(blockedAt(blocked, "Tue", 750)).toBe(false);
  });
});

describe("selectionText and changeText", () => {
  it("names the days and the time while dragging, then in the toast", () => {
    expect(selectionText(["Mon", "Tue", "Wed"], { start: 720, end: 780 }, false)).toBe("Mon–Wed 12:00–1:00 PM");
    expect(selectionText(["Mon"], { start: 720, end: 780 }, true)).toBe("Remove Mon 12:00–1:00 PM");
    expect(changeText(["Mon", "Tue", "Wed"], { start: 720, end: 780 }, false)).toBe("Blocked Mon–Wed 12–1 PM");
    expect(changeText(["Thu", "Fri"], { start: 690, end: 810 }, true)).toBe("Unblocked Thu, Fri 11:30 AM–1:30 PM");
    expect(changeText(["Tue"], { start: 750, end: 780 }, false)).toBe("Blocked Tue 12:30–1 PM");
  });
});

describe("changedDays", () => {
  it("lists only the days whose blocked times changed, so the toast and Name it leave the rest alone", () => {
    const before = [{ day: "Thu" as const, start: 720, end: 840, label: "Work" }];
    const ranges = dayRanges(WEEKDAYS, 2, 4, { start: 720, end: 780 });
    expect(changedDays(before, addRanges(before, ranges), ranges)).toEqual(["Wed", "Fri"]);
    expect(changedDays(before, subtractBlocked(before, ranges), ranges)).toEqual(["Thu"]);
    expect(changedDays(before, before, ranges)).toEqual([]);
  });
});
