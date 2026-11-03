import { describe, expect, it } from "vitest";
import type { Day } from "@/lib/data";
import { section } from "@/lib/plans/testing";
import type { SavedCourse } from "@/lib/plans/types";
import { buildIcs, icsFileName, sectionsWithoutTime } from "./ics";
import { termCalendar } from "./term-calendar";

const term = { id: "2027-C", start: "2027-01-13", end: "2027-03-05" };
const now = new Date("2026-10-31T16:30:05.000Z");

function course(code: string, ...sections: SavedCourse["sections"]): SavedCourse {
  return { code, title: code, sections };
}

const lecture = course(
  "PH 1110",
  section("PH 1110", "CL01", {
    instructors: ["Ada Lovelace"],
    meetings: [{ days: ["Mon", "Tue", "Thu", "Fri"], start: 540, end: 590, location: "Olin Hall 107" }],
  }),
);

function unfolded(text: string): string[] {
  return text.replace(/\r\n[ \t]/g, "").split("\r\n");
}

function events(text: string): string[][] {
  const blocks: string[][] = [];
  let inside = false;
  for (const line of unfolded(text)) {
    if (line === "BEGIN:VEVENT") blocks.push([]);
    else if (line === "END:VEVENT") inside = false;
    else if (inside) blocks.at(-1)!.push(line);
    inside ||= line === "BEGIN:VEVENT";
  }
  return blocks;
}

function only(text: string): string[] {
  const all = events(text);
  expect(all).toHaveLength(1);
  return all[0];
}

describe("buildIcs", () => {
  it("makes one repeating event per meeting with the class details", () => {
    expect(only(buildIcs([lecture], term, now))).toEqual([
      "UID:2027-C-PH%201110-CL01-0@goatplan",
      "DTSTAMP:20261031T163005Z",
      "SUMMARY:PH 1110 Lecture CL01",
      "DTSTART;TZID=America/New_York:20270114T090000",
      "DTEND;TZID=America/New_York:20270114T095000",
      "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,TH,FR;UNTIL=20270306T045959Z",
      "LOCATION:Olin Hall 107",
      "DESCRIPTION:Professor: Ada Lovelace\\nSection: CL01",
    ]);
  });

  it("starts on the first matching day on or after the start date", () => {
    const onStart = course("A 1", section("A 1", "C01", { meetings: [{ days: ["Wed"], start: 600, end: 650, location: "" }] }));
    const later = course("B 1", section("B 1", "C01", { meetings: [{ days: ["Tue"], start: 600, end: 650, location: "" }] }));
    const wrapsWeek = course("C 1", section("C 1", "C01", { meetings: [{ days: ["Mon", "Sat"], start: 600, end: 650, location: "" }] }));
    expect(only(buildIcs([onStart], term, now))).toContain("DTSTART;TZID=America/New_York:20270113T100000");
    expect(only(buildIcs([later], term, now))).toContain("DTSTART;TZID=America/New_York:20270119T100000");
    expect(only(buildIcs([wrapsWeek], term, now))).toContain("DTSTART;TZID=America/New_York:20270116T100000");
  });

  it("ends UNTIL at the last minute of the end date in New York, in UTC", () => {
    const untilOf = (end: string, start = "2027-01-13") => only(buildIcs([lecture], { ...term, start, end }, now)).find((line) => line.startsWith("RRULE"));
    expect(untilOf("2027-03-05")).toContain("UNTIL=20270306T045959Z");
    expect(untilOf("2027-03-13")).toContain("UNTIL=20270314T045959Z");
    expect(untilOf("2027-03-14")).toContain("UNTIL=20270315T035959Z");
    expect(untilOf("2027-04-29")).toContain("UNTIL=20270430T035959Z");
    expect(untilOf("2026-10-31", "2026-10-19")).toContain("UNTIL=20261101T035959Z");
    expect(untilOf("2026-11-01", "2026-10-19")).toContain("UNTIL=20261102T045959Z");
    expect(untilOf("2026-12-31", "2026-10-19")).toContain("UNTIL=20270101T045959Z");
  });

  it("holds class times across daylight saving with a New York VTIMEZONE", () => {
    const text = buildIcs([lecture], { ...term, end: "2027-04-29" }, now);
    const lines = unfolded(text);
    const block = lines.slice(lines.indexOf("BEGIN:VTIMEZONE"), lines.indexOf("END:VTIMEZONE") + 1);
    expect(block).toEqual(expect.arrayContaining([
      "TZID:America/New_York",
      "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
      "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
      "TZOFFSETTO:-0400",
      "TZOFFSETTO:-0500",
    ]));
    expect(lines.indexOf("BEGIN:VTIMEZONE")).toBeLessThan(lines.indexOf("BEGIN:VEVENT"));
    expect(text).not.toMatch(/DTSTART:\d{8}T\d{6}Z/);
    expect(only(text)).toContain("DTEND;TZID=America/New_York:20270114T095000");
  });

  it("uses a section's own dates over the term's", () => {
    const semester = course("MA 1020", section("MA 1020", "S01", {
      dates: { start: "2027-01-20", end: "2027-05-07" },
      meetings: [{ days: ["Mon"], start: 480, end: 530, location: "" }],
    }));
    const event = only(buildIcs([semester], term, now));
    expect(event).toContain("DTSTART;TZID=America/New_York:20270125T080000");
    expect(event).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO;UNTIL=20270508T035959Z");
  });

  it("makes separate events with their own IDs and rooms for each meeting and section", () => {
    const plan = [
      course("CS 1101",
        section("CS 1101", "CL01", { meetings: [
          { days: ["Mon", "Thu"], start: 600, end: 650, location: "Fuller Labs 320 Computer Lab" },
          { days: ["Tue"], start: 780, end: 830, location: "Kaven Hall 116" },
        ] }),
        section("CS 1101", "CD01", { type: "discussion", meetings: [{ days: ["Wed"], start: 660, end: 710, location: "Salisbury Labs 104" }] }),
      ),
    ];
    const all = events(buildIcs(plan, term, now));
    expect(all.map((event) => event[0])).toEqual([
      "UID:2027-C-CS%201101-CL01-0@goatplan",
      "UID:2027-C-CS%201101-CL01-1@goatplan",
      "UID:2027-C-CS%201101-CD01-0@goatplan",
    ]);
    expect(all[0]).toContain("LOCATION:Fuller Labs 320");
    expect(all[1]).toContain("LOCATION:Kaven Hall 116");
    expect(all[1]).toContain("DTSTART;TZID=America/New_York:20270119T130000");
    expect(all[2]).toContain("SUMMARY:CS 1101 Discussion CD01");
  });

  it("gives the same IDs whatever the timestamp, so importing again updates events", () => {
    const uid = (at: Date) => only(buildIcs([lecture], term, at))[0];
    expect(uid(new Date("2027-01-01T00:00:00Z"))).toBe(uid(now));
  });

  it("escapes special characters in text", () => {
    const tricky = course("HU 3900", section("HU 3900", "C;01", {
      instructors: ["Smith, Jr; Ann", "Back\\slash"],
      meetings: [{ days: ["Mon"], start: 540, end: 590, location: "Little Theatre, Alden\nHall" }],
    }));
    const event = only(buildIcs([tricky], term, now));
    expect(event[0]).toBe("UID:2027-C-HU%203900-C%3B01-0@goatplan");
    expect(event).toContain("SUMMARY:HU 3900 Lecture C\\;01");
    expect(event).toContain("LOCATION:Little Theatre\\, Alden\\nHall");
    expect(event).toContain("DESCRIPTION:Professors: Smith\\, Jr\\; Ann\\, Back\\\\slash\\nSection: C\\;01");
  });

  it("leaves out an empty location and a missing or hidden professor", () => {
    const noRoom = course("A 1", section("A 1", "C01", { instructors: [], meetings: [{ days: ["Mon"], start: 540, end: 590, location: "  " }] }));
    const lab = course("B 1", section("B 1", "X01", { type: "lab", instructors: ["Ada Lovelace"], meetings: [{ days: ["Mon"], start: 540, end: 590, location: "Atwater Kent 233" }] }));
    const event = only(buildIcs([noRoom], term, now));
    expect(event.some((line) => line.startsWith("LOCATION"))).toBe(false);
    expect(event).toContain("DESCRIPTION:Section: C01");
    expect(only(buildIcs([lab], term, now))).toContain("DESCRIPTION:Section: X01");
  });

  it("skips a meeting whose days never fall inside the dates", () => {
    const short = course("A 1", section("A 1", "C01", {
      dates: { start: "2027-01-13", end: "2027-01-14" },
      meetings: [{ days: ["Fri"], start: 540, end: 590, location: "" }],
    }));
    expect(events(buildIcs([short], term, now))).toEqual([]);
  });

  it("wraps the events in a calendar and uses CRLF line endings throughout", () => {
    const text = buildIcs([lecture], term, now);
    expect(text.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//GoatPlan//Calendar export//EN\r\n")).toBe(true);
    expect(text.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(text.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });

  it("folds long lines at 75 bytes without splitting characters", () => {
    const encoder = new TextEncoder();
    const long = course("HU 3900", section("HU 3900", "C01", {
      instructors: Array.from({ length: 6 }, (_, index) => `Zoë Müller-Łukasiewicz ${index}`),
      meetings: [{ days: ["Mon"], start: 540, end: 590, location: "🎭".repeat(50) }],
    }));
    const text = buildIcs([long], term, now);
    const lines = text.split("\r\n");
    expect(lines.some((line) => line.startsWith(" "))).toBe(true);
    for (const line of lines) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
      expect(new TextDecoder().decode(encoder.encode(line))).toBe(line);
    }
    expect(only(text)).toContain(`LOCATION:${"🎭".repeat(50)}`);
  });
});

describe("days off and swapped days", () => {
  const calendar = {
    noClass: [{ date: "2027-01-18", name: "Holiday" }, { date: "2027-02-12", name: "Wellness Day" }, { date: "2027-03-29", name: "Wellness Day" }],
    swaps: [{ date: "2027-01-13", runs: "Mon" as const }],
    notes: [],
  };

  function meetsOn(code: string, days: Day[], dates?: { start: string; end: string }) {
    return course(code, section(code, "C01", { dates, meetings: [{ days, start: 540, end: 590, location: "Olin Hall 107" }] }));
  }

  function build(...plan: SavedCourse[]) {
    return events(buildIcs(plan, term, now, calendar));
  }

  function exdates(event: string[]) {
    return event.filter((line) => line.startsWith("EXDATE"));
  }

  it("removes Wednesday classes on Jan 13 and adds Monday classes as a one-off", () => {
    const [wednesday, monday, oneOff, ...rest] = build(meetsOn("A 1", ["Wed"]), meetsOn("B 1", ["Mon"]));
    expect(rest).toEqual([]);
    expect(wednesday).toContain("SUMMARY:A 1 Lecture C01");
    expect(exdates(wednesday)).toContain("EXDATE;TZID=America/New_York:20270113T090000");
    expect(monday).toContain("SUMMARY:B 1 Lecture C01");
    expect(exdates(monday)).not.toContain("EXDATE;TZID=America/New_York:20270113T090000");
    expect(oneOff).toEqual([
      "UID:2027-C-B%201-C01-0-20270113@goatplan",
      "DTSTAMP:20261031T163005Z",
      "SUMMARY:B 1 Lecture C01",
      "DTSTART;TZID=America/New_York:20270113T090000",
      "DTEND;TZID=America/New_York:20270113T095000",
      "LOCATION:Olin Hall 107",
      "DESCRIPTION:Professor: Ye Lu\\nSection: C01",
    ]);
  });

  it("removes Wednesday classes on May 5 and adds Friday classes as a one-off", () => {
    const spring = { ...calendar, swaps: [{ date: "2027-05-05", runs: "Fri" as const }] };
    const dates = { start: "2027-03-15", end: "2027-05-05" };
    const [wednesday, friday, oneOff, ...rest] = events(buildIcs([meetsOn("A 1", ["Wed"], dates), meetsOn("B 1", ["Fri"], dates)], term, now, spring));
    expect(rest).toEqual([]);
    expect(exdates(wednesday)).toContain("EXDATE;TZID=America/New_York:20270505T090000");
    expect(friday).toContain("SUMMARY:B 1 Lecture C01");
    expect(oneOff).toContain("DTSTART;TZID=America/New_York:20270505T090000");
    expect(oneOff.some((line) => line.startsWith("RRULE"))).toBe(false);
  });

  it("never uses RDATE", () => {
    expect(buildIcs([meetsOn("B 1", ["Mon"])], term, now, calendar)).not.toContain("RDATE");
  });

  it("does both when a meeting runs on Monday and Wednesday", () => {
    const [weekly, oneOff] = build(meetsOn("A 1", ["Mon", "Wed"]));
    expect(exdates(weekly)).toEqual(["EXDATE;TZID=America/New_York:20270113T090000", "EXDATE;TZID=America/New_York:20270118T090000"]);
    expect(oneOff).toContain("DTSTART;TZID=America/New_York:20270113T090000");
  });

  it("removes Jan 18 and Feb 12 only from the classes that meet on those days", () => {
    const [monday, , friday, tuesday] = build(meetsOn("A 1", ["Mon"]), meetsOn("B 1", ["Fri"]), meetsOn("C 1", ["Tue"]));
    expect(exdates(monday)).toEqual(["EXDATE;TZID=America/New_York:20270118T090000"]);
    expect(exdates(friday)).toEqual(["EXDATE;TZID=America/New_York:20270212T090000"]);
    expect(exdates(tuesday)).toEqual([]);
  });

  it("keeps the local class time on a removed day after daylight saving starts", () => {
    const [weekly] = build(meetsOn("A 1", ["Mon"], { start: "2027-01-20", end: "2027-05-05" }));
    expect(exdates(weekly)).toEqual(["EXDATE;TZID=America/New_York:20270329T090000"]);
  });

  it("skips a swap day and a day off outside the section's own dates", () => {
    const late = build(meetsOn("A 1", ["Mon"], { start: "2027-02-08", end: "2027-03-05" }));
    expect(late).toHaveLength(1);
    expect(exdates(late[0])).toEqual([]);
    const early = build(meetsOn("B 1", ["Mon", "Wed"], { start: "2027-01-14", end: "2027-01-16" }));
    expect(early).toEqual([]);
  });

  it("doesn't add a swap day to a section that doesn't meet on the swapped weekday", () => {
    const [tuesday, ...rest] = build(meetsOn("A 1", ["Tue"]));
    expect(rest).toEqual([]);
    expect(exdates(tuesday)).toEqual([]);
  });

  it("adds a swap day even when the section has no weekly class left", () => {
    const [oneOff, ...rest] = build(meetsOn("A 1", ["Mon"], { start: "2027-01-13", end: "2027-01-14" }));
    expect(rest).toEqual([]);
    expect(oneOff).toContain("DTSTART;TZID=America/New_York:20270113T090000");
    expect(oneOff.some((line) => line.startsWith("RRULE"))).toBe(false);
  });

  it("drops a weekly event when every one of its classes is removed", () => {
    expect(build(meetsOn("A 1", ["Wed"], { start: "2027-01-13", end: "2027-01-19" }))).toEqual([]);
  });

  it("removes nothing without a term calendar", () => {
    const text = buildIcs([meetsOn("A 1", ["Mon", "Wed"])], term, now, null);
    expect(text).not.toContain("EXDATE");
    expect(events(text)).toHaveLength(1);
  });

  it("gives one-off events stable IDs", () => {
    const uid = (at: Date) => events(buildIcs([meetsOn("A 1", ["Mon"])], term, at, calendar))[1][0];
    expect(uid(new Date("2027-01-01T00:00:00Z"))).toBe(uid(now));
  });
});

describe("sections with no set time", () => {
  const plan = [
    lecture,
    course("CS 3043", section("CS 3043", "C01", { delivery: "online-async", meetings: [] })),
  ];

  it("get no event in the file", () => {
    const text = buildIcs(plan, term, now);
    expect(events(text)).toHaveLength(1);
    expect(text).not.toContain("CS 3043");
  });

  it("are listed so the export screen can say so", () => {
    expect(sectionsWithoutTime(plan)).toEqual(["CS 3043 Lecture C01"]);
    expect(sectionsWithoutTime([lecture])).toEqual([]);
  });
});

describe("icsFileName", () => {
  it("names the file after the term letter and year", () => {
    expect(icsFileName("2027-C")).toBe("GoatPlan-C-Term-2027.ics");
    expect(icsFileName("2026-B")).toBe("GoatPlan-B-Term-2026.ics");
  });
});

describe("Academic Advising Day", () => {
  it("has no Thursday class on Feb 25, 2027", () => {
    const thursday = course("A 1", section("A 1", "C01", { meetings: [{ days: ["Thu"], start: 600, end: 650, location: "" }] }));
    const text = buildIcs([thursday], term, now, termCalendar("2027-C"));
    expect(text).toContain("EXDATE;TZID=America/New_York:20270225T100000");
  });
});
