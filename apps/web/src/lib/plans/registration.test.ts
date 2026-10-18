import { describe, expect, it } from "vitest";
import {
  countLabel,
  meetingLines,
  registrationRows,
  savedLabel,
  sectionCount,
  sectionListText,
  termLabel,
} from "./registration";
import { designPlan, section, termWith } from "./testing";

describe("registrationRows", () => {
  it("gives one row per section, grouped by course in plan order, lecture before lab", () => {
    const plan = designPlan();
    const rows = registrationRows(plan, termWith(plan));
    expect(rows.map((row) => `${row.course} ${row.section}`)).toEqual([
      "AE 2320 CL01",
      "AE 2320 CX02",
      "AE 2410 C01",
      "AE 2210 C01",
    ]);
    expect(rows[0]).toEqual({
      id: "AE 2320-CL01",
      course: "AE 2320",
      courseTitle: "Introduction to Orbital Mechanics",
      section: "CL01",
      seats: "Lecture · 36 open",
      meetings: ["Mon–Fri · 9:00–9:50 AM"],
      room: "Unity Hall 400",
      instructors: "Ye Lu",
      change: null,
    });
    expect(rows[1]).toMatchObject({ seats: "Lab · 4 open", meetings: ["Thu · 3:00–3:50 PM"], room: "Higgins Labs 230" });
  });

  it("shows the latest seats and flags the change", () => {
    const plan = designPlan();
    const term = termWith(plan);
    term.courses[0].sections.find((item) => item.code === "CX02")!.enrolled = 40;
    const row = registrationRows(plan, term).find((item) => item.section === "CX02")!;
    expect(row.seats).toBe("Lab · 0 open");
    expect(row.change).toEqual({ kind: "filled", course: "AE 2320", section: "CX02" });
  });

  it("falls back to the saved copy for removed sections and while the latest data is unknown", () => {
    const plan = designPlan();
    const term = termWith(plan);
    term.courses = term.courses.filter((course) => course.code !== "AE 2210");
    const removed = registrationRows(plan, term).at(-1)!;
    expect(removed).toMatchObject({
      section: "C01",
      seats: "Lecture",
      room: "Salisbury Labs 104",
      change: { kind: "courseRemoved" },
    });
    expect(registrationRows(plan, null).every((row) => row.change === null)).toBe(true);
  });

  it("says when there's no room, instructor or set time", () => {
    const plan = designPlan({
      schedule: [{ code: "ID 2050", title: "Social Science Research", sections: [section("ID 2050", "D01", { instructors: [], meetings: [] })] }],
      courses: ["ID 2050"],
    });
    expect(registrationRows(plan, null)[0]).toMatchObject({
      meetings: ["No set time"],
      room: "No room listed",
      instructors: "No instructor yet",
    });
  });
});

describe("meetingLines", () => {
  it("writes AM/PM once when both ends share it, one line per meeting", () => {
    expect(
      meetingLines({
        meetings: [
          { days: ["Mon", "Tue", "Thu"], start: 690, end: 770, location: "" },
          { days: ["Fri"], start: 600, end: 650, location: "" },
        ],
      }),
    ).toEqual(["Mon, Tue, Thu · 11:30 AM–12:50 PM", "Fri · 10:00–10:50 AM"]);
  });
});

describe("sectionListText", () => {
  it("lists each course's sections with an em dash and lowercase types", () => {
    expect(sectionListText(designPlan().schedule)).toBe(
      ["AE 2320 — CL01 (lecture), CX02 (lab)", "AE 2410 — C01 (lecture)", "AE 2210 — C01 (lecture)"].join("\n"),
    );
  });
});

describe("labels", () => {
  it("counts sections and pluralizes plainly", () => {
    expect(sectionCount(designPlan())).toBe(4);
    expect(countLabel(1, "course")).toBe("1 course");
    expect(countLabel(3, "section")).toBe("3 sections");
    expect(termLabel({ name: "C Term", season: "Spring", year: 2027 })).toBe("C Term · Spring 2027");
  });

  it("shows when a plan was saved", () => {
    expect(savedLabel("2026-10-17T12:00:00.000Z")).toBe("Saved Oct 17, 2026");
    expect(savedLabel("not a date")).toBe("Saved");
  });
});
