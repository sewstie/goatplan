import { describe, expect, it } from "vitest";
import { formatDataDate, isTermOver, newYorkDate, openTerms, pickDefaultTerm } from "./terms";
import type { TermSummary } from "./types";

function term(id: string, start: string, end: string, status: TermSummary["status"]): TermSummary {
  return { id, name: id, season: "Fall", year: 2026, start, end, status, courses: 1, sections: 1, generatedAt: "" };
}

const terms = [
  term("2026-A", "2026-08-20", "2026-10-09", "in-progress"),
  term("2026-B", "2026-10-19", "2026-12-11", "upcoming"),
  term("2027-C", "2027-01-13", "2027-03-05", "upcoming"),
];

describe("newYorkDate", () => {
  it("uses New York time, not UTC", () => {
    expect(newYorkDate(new Date("2026-12-12T03:00:00Z"))).toBe("2026-12-11");
    expect(newYorkDate(new Date("2026-12-12T05:30:00Z"))).toBe("2026-12-12");
  });
});

describe("isTermOver", () => {
  it("keeps a term through its last day, in New York", () => {
    const b = terms[1];
    expect(isTermOver(b, new Date("2026-12-11T12:00:00Z"))).toBe(false);
    expect(isTermOver(b, new Date("2026-12-12T03:00:00Z"))).toBe(false);
    expect(isTermOver(b, new Date("2026-12-12T05:30:00Z"))).toBe(true);
  });
});

describe("openTerms", () => {
  it("drops terms that have ended", () => {
    expect(openTerms(terms, new Date("2026-10-17T12:00:00Z")).map((t) => t.id)).toEqual(["2026-B", "2027-C"]);
  });
});

describe("pickDefaultTerm", () => {
  const now = new Date("2026-10-17T12:00:00Z");

  it("prefers the remembered term while it's open", () => {
    expect(pickDefaultTerm(terms, "2027-C", now)?.id).toBe("2027-C");
  });

  it("falls back to the first upcoming term", () => {
    expect(pickDefaultTerm(terms, null, now)?.id).toBe("2026-B");
    expect(pickDefaultTerm(terms, "2026-A", now)?.id).toBe("2026-B");
  });

  it("uses the first open term when none is upcoming, and null when all ended", () => {
    const inProgress = [term("2026-B", "2026-10-19", "2026-12-11", "in-progress")];
    expect(pickDefaultTerm(inProgress, null, new Date("2026-11-01T12:00:00Z"))?.id).toBe("2026-B");
    expect(pickDefaultTerm(inProgress, null, new Date("2027-01-01T12:00:00Z"))).toBeNull();
  });
});

describe("formatDataDate", () => {
  it("writes a term's generatedAt as a short date in the given time zone", () => {
    expect(formatDataDate("2026-10-25T12:52:39Z", "America/New_York")).toBe("Oct 25, 2026");
    expect(formatDataDate("2026-10-25T02:00:00Z", "America/New_York")).toBe("Oct 24, 2026");
    expect(formatDataDate("2026-10-25T02:00:00Z", "UTC")).toBe("Oct 25, 2026");
    expect(formatDataDate("2027-01-06T20:30:00Z", "Asia/Tokyo")).toBe("Jan 7, 2027");
  });

  it("uses the student's own time zone by default", () => {
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
    for (const generatedAt of ["2026-10-25T02:00:00Z", "2026-10-25T12:52:39Z", "2026-12-31T23:59:59Z"]) {
      expect(formatDataDate(generatedAt)).toBe(formatDataDate(generatedAt, local));
    }
  });

  it.each(["", "not a date"])("gives null for %j, so nothing is shown", (generatedAt) => {
    expect(formatDataDate(generatedAt)).toBeNull();
  });
});
