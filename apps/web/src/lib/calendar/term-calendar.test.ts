import { describe, expect, it } from "vitest";
import { WEEK } from "@/lib/data";
import { section } from "@/lib/plans/testing";
import type { SavedCourse } from "@/lib/plans/types";
import file from "./term-calendar-data.json";
import {
  MISSING_CALENDAR_NOTE,
  exportNotes,
  termCalendar,
} from "./term-calendar";

function weekday(date: string) {
  return WEEK[(new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7];
}

const entries = Object.values(file.terms);
const outsideTermBreak = (day: { name: string }) =>
  day.name !== "Fall Break" && day.name !== "Spring Break";
const dates = (key: keyof typeof file.terms) =>
  file.terms[key].noClass.filter(outsideTermBreak).map((day) => day.date);

function exported(
  sectionDates?: { start: string; end: string },
  meetings = [
    { days: ["Mon" as const], start: 540, end: 590, location: "Olin Hall 107" },
  ],
): SavedCourse[] {
  return [
    {
      code: "A 1",
      title: "A",
      sections: [section("A 1", "C01", { dates: sectionDates, meetings })],
    },
  ];
}

describe("term calendar file", () => {
  it("records where the entries come from", () => {
    expect(file.source.url).toBe(
      "https://www.wpi.edu/sites/default/files/2025-07/WPI_Academic_Calendar_2026-27_July25.pdf",
    );
    expect(file.source.revised).toBe("July 2025");
  });

  it("matches every no-class day on the WPI calendar that a published section can reach", () => {
    expect(dates("2026-A")).toEqual(["2026-09-07", "2026-09-25"]);
    expect(dates("2026-B")).toEqual([
      "2026-11-03",
      "2026-11-25",
      "2026-11-26",
      "2026-11-27",
      "2026-12-07",
    ]);
    expect(dates("2027-C")).toEqual(["2027-01-18", "2027-02-12", "2027-02-25"]);
    expect(dates("2027-D")).toEqual(["2027-03-29", "2027-04-16", "2027-04-19"]);
    expect(dates("2027-E1")).toEqual(["2027-05-31", "2027-06-18"]);
  });

  it("matches every schedule swap on the WPI calendar that a published section can reach", () => {
    expect(file.terms["2026-A"].swaps).toEqual([
      { date: "2026-09-10", runs: "Mon" },
    ]);
    expect(file.terms["2026-B"].swaps).toEqual([]);
    expect(file.terms["2027-C"].swaps).toEqual([
      { date: "2027-01-13", runs: "Mon" },
    ]);
    expect(file.terms["2027-D"].swaps).toEqual([
      { date: "2027-03-30", runs: "Mon" },
      { date: "2027-05-05", runs: "Fri" },
    ]);
    expect(file.terms["2027-E1"].swaps).toEqual([
      { date: "2027-06-03", runs: "Mon" },
    ]);
  });

  it("falls on the weekdays WPI's calendar shows", () => {
    const shown = {
      "2026-09-07": "Mon",
      "2026-09-10": "Thu",
      "2026-09-25": "Fri",
      "2026-11-03": "Tue",
      "2026-11-25": "Wed",
      "2026-11-26": "Thu",
      "2026-11-27": "Fri",
      "2026-12-07": "Mon",
      "2027-01-13": "Wed",
      "2027-01-18": "Mon",
      "2027-02-12": "Fri",
      "2027-02-25": "Thu",
      "2027-03-29": "Mon",
      "2027-03-30": "Tue",
      "2027-04-16": "Fri",
      "2027-04-19": "Mon",
      "2027-05-05": "Wed",
      "2027-05-31": "Mon",
      "2027-06-03": "Thu",
      "2027-06-18": "Fri",
    };
    const listed = entries.flatMap((term) =>
      [...term.noClass.filter(outsideTermBreak), ...term.swaps].map(
        (entry) => entry.date,
      ),
    );
    expect([...listed].sort()).toEqual(Object.keys(shown).sort());
    for (const date of listed)
      expect(weekday(date)).toBe(shown[date as keyof typeof shown]);
  });

  it("covers both term breaks from the first weekend through the last", () => {
    for (const [term, name, start] of [
      ["2026-A", "Fall Break", "2026-10-10"],
      ["2027-C", "Spring Break", "2027-03-06"],
    ] as const) {
      const dates = file.terms[term].noClass
        .filter((day) => day.name === name)
        .map((day) => day.date);
      expect(dates).toEqual(
        Array.from({ length: 9 }, (_, index) =>
          new Date(Date.parse(start) + index * 86400000)
            .toISOString()
            .slice(0, 10),
        ),
      );
    }
  });
});

describe("termCalendar", () => {
  it("has nothing for a term without an entry", () => {
    expect(termCalendar("2030-A")).toBeNull();
  });

  it("has an entry for every published term", () => {
    for (const id of ["2026-B", "2027-C", "2027-D"])
      expect(termCalendar(id)).not.toBeNull();
  });

  it("includes the other terms' days, because longer sections run through them", () => {
    const fall = termCalendar("2026-B")!;
    expect(fall.noClass.map((day) => day.date)).toContain("2026-09-07");
    expect(fall.swaps.map((swap) => swap.date)).toContain("2026-09-10");
    const spring = termCalendar("2027-C")!;
    expect(spring.noClass.map((day) => day.date)).toContain("2027-04-19");
    expect(spring.swaps.map((swap) => swap.date)).toContain("2027-05-05");
    const later = termCalendar("2027-D")!;
    expect(later.noClass.map((day) => day.date)).toEqual(
      expect.arrayContaining(["2027-01-18", "2027-05-31"]),
    );
    expect(later.swaps.map((swap) => swap.date)).toEqual(
      expect.arrayContaining(["2027-01-13", "2027-06-03"]),
    );
  });
});

describe("exportNotes", () => {
  const term = { start: "2027-01-13", end: "2027-03-05" };
  const notes = (plan: SavedCourse[], id = "2027-C", dates = term) =>
    exportNotes(termCalendar(id), plan, dates);

  it("warns when a term has no calendar", () => {
    expect(MISSING_CALENDAR_NOTE).toBe(
      "Holidays aren't removed. Check WPI's calendar.",
    );
    expect(exportNotes(null, exported(), term)).toEqual([
      MISSING_CALENDAR_NOTE,
    ]);
  });

  it("has no note for Academic Advising Day, which is a day with no classes", () => {
    expect(notes(exported()).join(" ")).not.toContain("Feb 25");
    expect(termCalendar("2027-C")!.noClass).toContainEqual({
      date: "2027-02-25",
      name: "Academic Advising Day",
    });
  });

  it("leaves out a day the exported sections don't reach", () => {
    expect(notes(exported()).join(" ")).not.toContain("Dec 7");
  });

  it("explains how to handle makeup classes on reading day", () => {
    const fall = { start: "2026-10-19", end: "2026-12-11" };
    expect(notes(exported(), "2026-B", fall).join(" ")).toContain("Dec 7");
  });

  it("ignores sections with no set time", () => {
    expect(notes(exported(undefined, []))).toEqual([]);
  });
});
