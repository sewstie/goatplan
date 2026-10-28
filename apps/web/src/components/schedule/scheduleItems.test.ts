import { describe, expect, it } from "vitest";
import type { Section, TermFile } from "@/lib/data/types";
import { courseSlot } from "@/components/ui/courseColors";
import { scheduleItems } from "./scheduleItems";
import { visibleDays } from "./weekDays";

function section(id: string, changes: Partial<Section> = {}): Section {
  return {
    id,
    code: id.split("-")[1],
    type: "lecture",
    status: "open",
    enrolled: 10,
    capacity: 40,
    waitlist: { taken: 0, capacity: 0 },
    instructors: ["Ye Lu"],
    delivery: "in-person",
    meetings: [{ days: ["Mon", "Wed"], start: 540, end: 590, location: "Unity Hall 400" }],
    ...changes,
  };
}

const term: TermFile = {
  term: { id: "2027-C", name: "C Term", season: "Spring", year: 2027, start: "2027-01-13", end: "2027-03-05" },
  generatedAt: "2026-10-17T12:52:39Z",
  courses: [
    {
      code: "AE 2320",
      subject: "AE",
      title: "Introduction to Orbital Mechanics",
      credits: 3,
      level: "Undergraduate",
      description: "",
      sections: [
        section("AE 2320-CL01"),
        section("AE 2320-CX02", { type: "lab", meetings: [{ days: ["Thu"], start: 900, end: 950, location: "Higgins Labs 230" }] }),
      ],
      options: [["AE 2320-CL01", "AE 2320-CX02"]],
    },
    {
      code: "AE 5131",
      subject: "AE",
      title: "Incompressible Fluid Dynamics",
      credits: 3,
      level: "Graduate",
      description: "",
      sections: [section("AE 5131-C01", { meetings: [], delivery: "online-async", status: "waitlist" })],
      options: [["AE 5131-C01"]],
    },
    {
      code: "HU 3900",
      subject: "HU",
      title: "Inquiry Seminar",
      credits: 3,
      level: "Undergraduate",
      description: "",
      sections: [section("HU 3900-C01", { title: "INQ SEM: Early American History" })],
      options: [["HU 3900-C01"]],
    },
  ],
};

const chosen = {
  "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"],
  "AE 5131": ["AE 5131-C01"],
  "HU 3900": ["HU 3900-C01"],
};

describe("scheduleItems", () => {
  it("makes one block per meeting day, in the order the courses were added", () => {
    const { classes } = scheduleItems(term, ["AE 2320", "HU 3900"], chosen, {});
    expect(classes.map((item) => item.key)).toEqual([
      "AE 2320-CL01|Mon|540",
      "AE 2320-CL01|Wed|540",
      "AE 2320-CX02|Thu|900",
      "HU 3900-C01|Mon|540",
      "HU 3900-C01|Wed|540",
    ]);
    expect(classes[2]).toMatchObject({
      courseCode: "AE 2320",
      title: "Introduction to Orbital Mechanics",
      sectionCode: "CX02",
      day: "Thu",
      start: 900,
      end: 950,
      location: "Higgins Labs 230",
      instructors: [],
      slot: 1,
      locked: false,
    });
    expect(classes[0].instructors).toEqual(["Ye Lu"]);
  });

  it("uses a section's own title for topic courses", () => {
    const { classes } = scheduleItems(term, ["HU 3900"], chosen, {});
    expect(classes[0].title).toBe("INQ SEM: Early American History");
  });

  it("marks locked sections", () => {
    const { classes } = scheduleItems(term, ["AE 2320"], chosen, { "AE 2320": ["AE 2320-CX02"] });
    expect(classes.map((item) => item.locked)).toEqual([false, false, true]);
  });

  it("lists sections with no meetings separately and notes waitlist-only ones", () => {
    const items = scheduleItems(term, ["AE 2320", "AE 5131"], chosen, {});
    expect(items.untimed).toEqual([
      expect.objectContaining({ courseCode: "AE 5131", sectionCode: "C01", delivery: "online-async", slot: 2 }),
    ]);
    expect(items.waitlisted).toEqual([{ courseCode: "AE 5131", sectionCode: "C01" }]);
  });

  it("leaves out courses that aren't in the plan any more, and unknown sections", () => {
    const items = scheduleItems(term, ["AE 5131"], { ...chosen, "AE 5131": ["AE 5131-X99"] }, {});
    expect(items).toEqual({ classes: [], untimed: [], waitlisted: [] });
  });

  it("has nothing to show without a term", () => {
    expect(scheduleItems(null, ["AE 2320"], chosen, {})).toEqual({ classes: [], untimed: [], waitlisted: [] });
  });
});

describe("courseSlot", () => {
  it("follows the order courses were added and repeats after four", () => {
    const courses = ["A", "B", "C", "D", "E"];
    expect(courses.map((code) => courseSlot(courses, code))).toEqual([1, 2, 3, 4, 1]);
  });
});

describe("visibleDays", () => {
  it("shows Monday–Friday unless something falls on a weekend", () => {
    expect(visibleDays([{ day: "Mon" }, { day: "Fri" }])).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri"]);
    expect(visibleDays([{ day: "Sat" }])).toHaveLength(7);
    expect(visibleDays([{ day: "Sun" }])).toHaveLength(7);
  });
});
