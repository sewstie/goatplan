import { describe, expect, it } from "vitest";
import type { Day } from "@/lib/data/types";
import type { ClassItem, UntimedItem } from "./scheduleItems";
import { dayView } from "./dayView";

function classItem(overrides: Partial<ClassItem> = {}): ClassItem {
  return {
    courseCode: "AE 2320",
    title: "Introduction to Orbital Mechanics",
    sectionId: "AE 2320-CL01",
    sectionCode: "CL01",
    instructors: ["Ye Lu"],
    slot: 1,
    locked: false,
    key: "AE 2320-CL01|Mon|540",
    day: "Mon",
    start: 540,
    end: 590,
    location: "Unity Hall 400",
    ...overrides,
  };
}

function untimedItem(overrides: Partial<UntimedItem> = {}): UntimedItem {
  return {
    courseCode: "AE 5131",
    title: "Incompressible Fluid Dynamics",
    sectionId: "AE 5131-C01",
    sectionCode: "C01",
    instructors: ["Ye Lu"],
    slot: 3,
    locked: false,
    delivery: "online-async",
    ...overrides,
  };
}

describe("dayView", () => {
  describe("tabs (days to show)", () => {
    it("shows Mon–Fri when all classes are on weekdays", () => {
      const classes = [classItem({ day: "Mon" }), classItem({ day: "Wed", key: "x|Wed|540" })];
      const result = dayView(classes, [], "Mon");
      expect(result.tabs.map((t) => t.day)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri"]);
    });

    it("includes Sat and Sun only when they have classes", () => {
      const classes = [classItem({ day: "Mon" }), classItem({ day: "Sat", key: "x|Sat|600" })];
      const result = dayView(classes, [], "Mon");
      expect(result.tabs.map((t) => t.day)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    });

    it("marks days with classes as hasClasses: true", () => {
      const classes = [
        classItem({ day: "Mon" }),
        classItem({ day: "Wed", key: "x|Wed|540" }),
      ];
      const result = dayView(classes, [], "Mon");
      const map = Object.fromEntries(result.tabs.map((t) => [t.day, t.hasClasses]));
      expect(map).toEqual({
        Mon: true,
        Tue: false,
        Wed: true,
        Thu: false,
        Fri: false,
      });
    });

    it("counts blocked times toward hasClasses", () => {
      const blocked = [{ day: "Tue" as Day, start: 540, end: 600 }];
      const result = dayView([], blocked, "Mon");
      expect(result.tabs.find((t) => t.day === "Tue")!.hasClasses).toBe(true);
    });
  });

  describe("default day", () => {
    it("opens on today when it's a weekday with classes", () => {
      const classes = [classItem({ day: "Wed", key: "x|Wed|540" })];
      const result = dayView(classes, [], "Wed");
      expect(result.selectedDay).toBe("Wed");
    });

    it("advances to the next day with classes when today is empty", () => {
      const classes = [classItem({ day: "Mon" })];
      const result = dayView(classes, [], "Tue");
      // Tue has no classes; searching forward wraps to Mon.
      expect(result.selectedDay).toBe("Mon");
    });

    it("opens on the next day with classes when today has none and there's a later one this week", () => {
      const classes = [classItem({ day: "Thu", key: "x|Thu|540" })];
      const result = dayView(classes, [], "Tue");
      expect(result.selectedDay).toBe("Thu");
    });

    it("wraps to Monday on Saturday", () => {
      const classes = [classItem({ day: "Mon" })];
      const result = dayView(classes, [], "Sat");
      expect(result.selectedDay).toBe("Mon");
    });

    it("wraps to the next day with classes from Monday on Sunday", () => {
      const classes = [classItem({ day: "Wed", key: "x|Wed|540" })];
      const result = dayView(classes, [], "Sun");
      // Weekend wraps to Monday, then advances to Wed (next with classes).
      expect(result.selectedDay).toBe("Wed");
    });

    it("opens Monday when no day has classes (weekend)", () => {
      const result = dayView([], [], "Sat");
      expect(result.selectedDay).toBe("Mon");
    });

    it("opens Monday when no day has classes (weekday)", () => {
      const result = dayView([], [], "Mon");
      expect(result.selectedDay).toBe("Mon");
    });

    it("wraps from Friday to Monday when no later weekday has classes", () => {
      const classes = [classItem({ day: "Mon" }), classItem({ day: "Tue", key: "x|Tue|540" })];
      const result = dayView(classes, [], "Fri");
      expect(result.selectedDay).toBe("Mon");
    });
  });

  describe("day classes", () => {
    it("sorts classes by start time", () => {
      const classes = [
        classItem({ day: "Mon", start: 600, end: 650, key: "a|Mon|600" }),
        classItem({ day: "Mon", start: 540, end: 590, key: "b|Mon|540" }),
        classItem({ day: "Mon", start: 660, end: 710, key: "c|Mon|660" }),
      ];
      const result = dayView(classes, [], "Mon");
      const monClasses = result.dayClasses("Mon");
      expect(monClasses.map((c) => c.start)).toEqual([540, 600, 660]);
    });

    it("keeps classes and no-set-time items apart", () => {
      const classes = [classItem({ day: "Mon" })];
      const untimed = [untimedItem()];
      const result = dayView(classes, untimed, "Mon");
      expect(result.dayClasses("Mon")).toHaveLength(1);
      expect(result.untimedItems).toHaveLength(1);
      expect(result.untimedItems[0].courseCode).toBe("AE 5131");
    });

    it("returns empty for days with no classes", () => {
      const classes = [classItem({ day: "Mon" })];
      const result = dayView(classes, [], "Mon");
      expect(result.dayClasses("Tue")).toEqual([]);
    });
  });

  describe("blocked times", () => {
    it("includes blocked times in dayClasses sorted with regular classes", () => {
      const classes = [classItem({ day: "Mon", start: 540, end: 590 })];
      const blocked = [{ day: "Mon" as Day, start: 600, end: 660, label: "Work" }];
      const result = dayView(classes, blocked, "Mon");
      const items = result.dayClasses("Mon");
      expect(items).toHaveLength(2);
      expect(items[0].kind).toBe("class");
      expect(items[1].kind).toBe("blocked");
    });
  });
});
