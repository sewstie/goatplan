import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { selectTerms, todayInNewYork } from "../lib/select-terms.mjs";

const built = (id, season, start, end) => ({
  term: { id, name: `${id.split("-")[1]} Term`, season, year: Number(id.slice(0, 4)), start, end },
  courses: [],
});

const A = built("2026-A", "Fall", "2026-08-20", "2026-10-09");
const B = built("2026-B", "Fall", "2026-10-19", "2026-12-11");
const C = built("2027-C", "Spring", "2027-01-13", "2027-03-05");
const D = built("2027-D", "Spring", "2027-03-15", "2027-05-05");
const NEXT_A = built("2027-A", "Fall", "2027-08-19", "2027-10-08");
const NEXT_B = built("2027-B", "Fall", "2027-10-18", "2027-12-10");
const NEXT_C = built("2028-C", "Spring", "2028-01-12", "2028-03-03");
const AFTER_NEXT_A = built("2028-A", "Fall", "2028-08-24", "2028-10-12");

const select = (terms, today) => {
  const { kept, dropped } = selectTerms(terms, today);
  return {
    kept: kept.map(({ term, status }) => `${term.id} ${status}`),
    dropped: dropped.map(({ id }) => id),
  };
};

describe("todayInNewYork", () => {
  it("gives the New York date, not the UTC one", () => {
    // 11:30 PM on October 9 in New York is already October 10 in UTC.
    assert.equal(todayInNewYork(new Date("2026-10-10T03:30:00Z")), "2026-10-09");
    assert.equal(todayInNewYork(new Date("2026-10-10T04:00:00Z")), "2026-10-10");
  });

  it("follows daylight saving time", () => {
    // In December New York is five hours behind UTC instead of four.
    assert.equal(todayInNewYork(new Date("2026-12-12T04:59:00Z")), "2026-12-11");
    assert.equal(todayInNewYork(new Date("2026-12-12T05:00:00Z")), "2026-12-12");
  });

  it("pads the month and day", () => {
    assert.equal(todayInNewYork(new Date("2027-03-06T15:00:00Z")), "2027-03-06");
  });
});

describe("selectTerms", () => {
  const year = [A, B, C, D, NEXT_B];

  it("drops a term that has ended and holds back next year's (October 11, 2026)", () => {
    const { kept, dropped } = selectTerms(year, "2026-10-11");
    assert.deepEqual(
      kept.map(({ term, status }) => [term.id, status]),
      [
        ["2026-B", "upcoming"],
        ["2027-C", "upcoming"],
        ["2027-D", "upcoming"],
      ],
    );
    assert.deepEqual(dropped, [
      { id: "2026-A", reason: "ended 2026-10-09" },
      { id: "2027-B", reason: "next year's term, held back until C Term ends 2027-03-05" },
    ]);
  });

  it("keeps the courses of the terms it keeps", () => {
    const withCourses = [{ ...B, courses: [{ code: "AE 2320" }] }];
    assert.deepEqual(selectTerms(withCourses, "2026-10-11").kept[0].courses, [{ code: "AE 2320" }]);
  });

  it("counts a term as current through its last day", () => {
    assert.deepEqual(select(year, "2026-10-09").kept[0], "2026-A in-progress");
    assert.deepEqual(select(year, "2026-10-10").dropped, ["2026-A", "2027-B"]);
  });

  it("labels a term in-progress from its first day", () => {
    assert.deepEqual(select(year, "2026-10-18").kept[0], "2026-B upcoming");
    assert.deepEqual(select(year, "2026-10-19").kept[0], "2026-B in-progress");
    assert.deepEqual(select(year, "2026-09-01").kept, [
      "2026-A in-progress",
      "2026-B upcoming",
      "2027-C upcoming",
      "2027-D upcoming",
    ]);
  });

  it("shows next year's terms once this year's C Term has ended", () => {
    const terms = [A, B, C, D, NEXT_A, NEXT_B];
    assert.deepEqual(select(terms, "2027-03-05"), {
      kept: ["2027-C in-progress", "2027-D upcoming"],
      dropped: ["2026-A", "2026-B", "2027-A", "2027-B"],
    });
    assert.deepEqual(select(terms, "2027-03-06"), {
      kept: ["2027-D upcoming", "2027-A upcoming", "2027-B upcoming"],
      dropped: ["2026-A", "2026-B", "2027-C"],
    });
  });

  it("still shows next year's terms after WPI removes C Term from its file", () => {
    assert.deepEqual(select([D, NEXT_A, NEXT_B], "2027-04-01").kept, [
      "2027-D in-progress",
      "2027-A upcoming",
      "2027-B upcoming",
    ]);
  });

  it("holds next year's terms back while C Term is not published yet", () => {
    assert.deepEqual(select([A, B, NEXT_B], "2026-10-11"), {
      kept: ["2026-B upcoming"],
      dropped: ["2026-A", "2027-B"],
    });
  });

  it("moves on to the next academic year once this one is over", () => {
    const terms = [C, D, NEXT_A, NEXT_B, NEXT_C, AFTER_NEXT_A];
    assert.deepEqual(select(terms, "2027-06-01"), {
      kept: ["2027-A upcoming", "2027-B upcoming", "2028-C upcoming"],
      dropped: ["2027-C", "2027-D", "2028-A"],
    });
  });

  it("never shows a term more than a year ahead", () => {
    const { dropped } = selectTerms([D, NEXT_A, AFTER_NEXT_A], "2027-04-01");
    assert.deepEqual(dropped, [{ id: "2028-A", reason: "more than a year ahead" }]);
  });

  it("keeps nothing when every term has ended", () => {
    assert.deepEqual(select([A, B], "2027-01-01"), { kept: [], dropped: ["2026-A", "2026-B"] });
  });
});
