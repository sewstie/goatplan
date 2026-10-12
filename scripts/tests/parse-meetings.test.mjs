import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mergeMeetings, parseDays, parseMeetings, parseTime } from "../lib/parse-meetings.mjs";

describe("parseTime", () => {
  it("reads morning and afternoon times as minutes after midnight", () => {
    assert.equal(parseTime("9:00 AM"), 540);
    assert.equal(parseTime("9:50 AM"), 590);
    assert.equal(parseTime("2:00 PM"), 840);
    assert.equal(parseTime("8:50 PM"), 1250);
  });

  it("treats 12 PM as noon", () => {
    assert.equal(parseTime("12:00 PM"), 720);
    assert.equal(parseTime("12:50 PM"), 770);
  });

  it("treats 12 AM as midnight", () => {
    assert.equal(parseTime("12:00 AM"), 0);
    assert.equal(parseTime("12:30 AM"), 30);
    assert.equal(parseTime("11:59 PM"), 1439);
  });

  it("accepts small differences in spacing and case", () => {
    assert.equal(parseTime(" 9:00 am "), 540);
    assert.equal(parseTime("9:00PM"), 1260);
  });

  it("returns null for anything that is not a time", () => {
    for (const text of ["", "TBA", "9 AM", "13:00 PM", "0:30 AM", "9:60 AM", "9:00", undefined]) {
      assert.equal(parseTime(text), null, `parseTime(${JSON.stringify(text)})`);
    }
  });
});

describe("parseDays", () => {
  it("turns R into Thursday", () => {
    assert.deepEqual(parseDays("M-T-R-F"), ["Mon", "Tue", "Thu", "Fri"]);
    assert.deepEqual(parseDays("R"), ["Thu"]);
    assert.deepEqual(parseDays("T-R"), ["Tue", "Thu"]);
  });

  it("reads every weekday pattern", () => {
    assert.deepEqual(parseDays("M-T-W-R-F"), ["Mon", "Tue", "Wed", "Thu", "Fri"]);
    assert.deepEqual(parseDays("W"), ["Wed"]);
    assert.deepEqual(parseDays("S-U"), ["Sat", "Sun"]);
  });

  it("returns days in week order without repeats", () => {
    assert.deepEqual(parseDays("F-M-M"), ["Mon", "Fri"]);
  });

  it("returns [] for empty text and null for an unknown letter", () => {
    assert.deepEqual(parseDays(""), []);
    assert.deepEqual(parseDays(undefined), []);
    assert.equal(parseDays("M-X"), null);
    assert.equal(parseDays("TBA"), null);
  });
});

describe("parseMeetings", () => {
  it("reads one pattern with its room", () => {
    assert.deepEqual(parseMeetings("M-T-R-F | 9:00 AM - 9:50 AM", "Fuller Labs 311"), [
      { days: ["Mon", "Tue", "Thu", "Fri"], start: 540, end: 590, location: "Fuller Labs 311" },
    ]);
  });

  it("reads several patterns and sorts them in week order", () => {
    const meetings = parseMeetings(
      "W | 1:00 PM - 2:50 PM; M | 1:00 PM - 1:50 PM",
      "Fuller Labs 320; Olin Hall 126",
    );
    assert.deepEqual(meetings, [
      { days: ["Mon"], start: 780, end: 830, location: "Olin Hall 126" },
      { days: ["Wed"], start: 780, end: 890, location: "Fuller Labs 320" },
    ]);
  });

  it("uses a single room for every pattern", () => {
    const meetings = parseMeetings(
      "M-R | 2:00 PM - 3:50 PM; W | 2:00 PM - 2:50 PM",
      "Unity Hall 520",
    );
    assert.deepEqual(
      meetings.map((m) => m.location),
      ["Unity Hall 520", "Unity Hall 520"],
    );
  });

  it("matches rooms through Section_Details when the lists differ in length", () => {
    const meetings = parseMeetings(
      "T | 10:00 AM - 11:50 AM; R | 10:00 AM - 10:50 AM; M | 10:00 AM - 10:50 AM",
      "Salisbury Labs 226 HUA Seminar Room; Daniels Hall 102E CWB Programming Room",
      {
        details:
          "Daniels Hall 102E CWB Programming Room | M | 10:00 AM - 10:50 AM; " +
          "Salisbury Labs 226 HUA Seminar Room | T | 10:00 AM - 11:50 AM; " +
          "Daniels Hall 102E CWB Programming Room | R | 10:00 AM - 10:50 AM",
      },
    );
    assert.deepEqual(meetings, [
      { days: ["Mon"], start: 600, end: 650, location: "Daniels Hall 102E CWB Programming Room" },
      { days: ["Tue"], start: 600, end: 710, location: "Salisbury Labs 226 HUA Seminar Room" },
      { days: ["Thu"], start: 600, end: 650, location: "Daniels Hall 102E CWB Programming Room" },
    ]);
  });

  it("keeps one meeting when a class is split across two rooms", () => {
    const patterns = "W | 12:00 PM - 1:50 PM";
    const locations = "Innovation Studio 203 Active Learning Classroom South; Salisbury Labs 105";
    const expected = [
      {
        days: ["Wed"],
        start: 720,
        end: 830,
        location: "Innovation Studio 203 Active Learning Classroom South / Salisbury Labs 105",
      },
    ];
    assert.deepEqual(parseMeetings(patterns, locations), expected);
    assert.deepEqual(
      parseMeetings(patterns, locations, {
        details:
          "Innovation Studio 203 Active Learning Classroom South | W | 12:00 PM - 1:50 PM; " +
          "Salisbury Labs 105 | W | 12:00 PM - 1:50 PM",
      }),
      expected,
    );
  });

  it("keeps the date range of a pattern that covers part of a semester", () => {
    const meetings = parseMeetings(
      "T-F | 2:00 PM - 3:20 PM | 10/19/2026 - 12/11/2026; " +
        "T-F | 2:00 PM - 3:20 PM | 08/20/2026 - 10/09/2026",
      "Fuller Labs 311; Salisbury Labs 411",
    );
    assert.deepEqual(meetings, [
      {
        days: ["Tue", "Fri"],
        start: 840,
        end: 920,
        location: "Salisbury Labs 411",
        dates: { start: "2026-08-20", end: "2026-10-09" },
      },
      {
        days: ["Tue", "Fri"],
        start: 840,
        end: 920,
        location: "Fuller Labs 311",
        dates: { start: "2026-10-19", end: "2026-12-11" },
      },
    ]);
  });

  it("returns [] when there is no set time", () => {
    assert.deepEqual(parseMeetings("", ""), []);
    assert.deepEqual(parseMeetings(undefined, undefined), []);
    assert.deepEqual(parseMeetings("TBA", "TBA"), []);
    assert.deepEqual(
      parseMeetings("", "Online-asynchronous", { details: "Online-asynchronous |" }),
      [],
    );
  });

  it("reports patterns it cannot read instead of guessing", () => {
    const unparsed = [];
    const meetings = parseMeetings(
      "M-W | noon - 1:00 PM; Q | 9:00 AM - 9:50 AM; F | 3:00 PM - 2:00 PM; T | 9:00 AM - 9:50 AM",
      "Olin Hall 107",
      { onUnparsed: (pattern) => unparsed.push(pattern) },
    );
    assert.deepEqual(meetings, [{ days: ["Tue"], start: 540, end: 590, location: "Olin Hall 107" }]);
    assert.deepEqual(unparsed, [
      "M-W | noon - 1:00 PM",
      "Q | 9:00 AM - 9:50 AM",
      "F | 3:00 PM - 2:00 PM",
    ]);
  });
});

describe("mergeMeetings", () => {
  it("joins meetings at the same time and leaves the others alone", () => {
    const merged = mergeMeetings([
      { days: ["Tue", "Fri"], start: 840, end: 920, location: "Salisbury Labs 411" },
      { days: ["Mon"], start: 540, end: 590, location: "Olin Hall 107" },
      { days: ["Tue", "Fri"], start: 840, end: 920, location: "Fuller Labs 311" },
    ]);
    assert.deepEqual(merged, [
      { days: ["Mon"], start: 540, end: 590, location: "Olin Hall 107" },
      {
        days: ["Tue", "Fri"],
        start: 840,
        end: 920,
        location: "Fuller Labs 311 / Salisbury Labs 411",
      },
    ]);
  });
});
