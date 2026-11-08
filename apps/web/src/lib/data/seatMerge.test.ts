import { describe, expect, it } from "vitest";
import type { TermFile } from "./types";
import { applySeatMerge, seatMergeBytes, withLiveSeats } from "./seatMerge";

function makeTerm(): TermFile {
  return {
    term: { id: "2027-C", name: "C Term 2027", season: "Spring", year: 2027, start: "2027-01-13", end: "2027-03-05" },
    generatedAt: "2026-10-17T12:52:39Z",
    courses: [
      {
        code: "CS 2303",
        subject: "CS",
        title: "Systems Programming",
        credits: 3,
        level: "Undergraduate",
        description: "",
        sections: [
          {
            id: "CS 2303-C01",
            code: "C01",
            type: "lecture",
            status: "open",
            enrolled: 30,
            capacity: 40,
            waitlist: { taken: 0, capacity: 0 },
            instructors: ["Hugh C. Lauer"],
            delivery: "in-person",
            meetings: [{ days: ["Mon", "Wed"], start: 540, end: 590, location: "FL 320" }],
          },
        ],
        options: [["CS 2303-C01"]],
      },
    ],
  };
}

describe("seat merge", () => {
  it("merges waitlists as well as counts and status, leaving missing sections alone", () => {
    const term = makeTerm();
    const update = { enrolled: 40, capacity: 40, status: "waitlist" as const, waitlist: { taken: 3, capacity: 10 } };
    const merged = applySeatMerge(term, new Map([["CS 2303-C01", update]]));
    expect(merged.courses[0].sections[0]).toMatchObject(update);
    expect(term.courses[0].sections[0].waitlist.taken).toBe(0);
    expect(applySeatMerge(merged, new Map([["UNKNOWN", update]]))).toBe(merged);
  });

  it("reuses a term when its seat values have not changed", () => {
    const term = makeTerm();
    expect(applySeatMerge(term, new Map([["CS 2303-C01", term.courses[0].sections[0]]]))).toBe(term);
  });
  it("returns the term unchanged when there is no seat data", () => {
    const term = makeTerm();
    const merged = applySeatMerge(term, null);
    expect(merged).toBe(term);
    expect(merged).toEqual(term);
  });

  it("applies seat data to the parsed term", () => {
    const term = makeTerm();
    const seats = new Map([["CS 2303-C01", { enrolled: 38, capacity: 40, status: "open" as const, waitlist: { taken: 0, capacity: 0 } }]]);
    const merged = applySeatMerge(term, seats);
    expect(merged.courses[0].sections[0].enrolled).toBe(38);
  });

  it("does not mutate the original term when merging", () => {
    const term = makeTerm();
    const seats = new Map([["CS 2303-C01", { enrolled: 38, capacity: 40, status: "open" as const, waitlist: { taken: 0, capacity: 0 } }]]);
    applySeatMerge(term, seats);
    expect(term.courses[0].sections[0].enrolled).toBe(30);
  });

  it("leaves unknown sections unchanged", () => {
    const term = makeTerm();
    const seats = new Map([["UNKNOWN-C01", { enrolled: 10, capacity: 20, status: "open" as const, waitlist: { taken: 0, capacity: 0 } }]]);
    const merged = applySeatMerge(term, seats);
    expect(merged.courses[0].sections[0].enrolled).toBe(30);
  });

  it("produces bytes that reflect the merged data", () => {
    const term = makeTerm();
    const seats = new Map([["CS 2303-C01", { enrolled: 38, capacity: 40, status: "open" as const, waitlist: { taken: 0, capacity: 0 } }]]);
    const merged = applySeatMerge(term, seats);
    const bytes = seatMergeBytes(merged);
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as TermFile;
    expect(parsed.courses[0].sections[0].enrolled).toBe(38);
  });
});

describe("live seats", () => {
  const snapshot = (overrides = {}) => ({
    termId: "2027-C",
    fetchedAt: "2026-11-12T12:00:00Z",
    sections: [{ id: "CS 2303-C01", enrolled: 40, capacity: 40, status: "closed" as const, waitlist: { taken: 2, capacity: 10 } }],
    ...overrides,
  });

  it("merges a snapshot newer than the daily file and dates the seats by it", () => {
    const daily = makeTerm();
    const { term, seatsUpdatedAt } = withLiveSeats(daily, daily, snapshot());
    expect(term.courses[0].sections[0]).toMatchObject({ enrolled: 40, status: "closed" });
    expect(seatsUpdatedAt).toBe("2026-11-12T12:00:00Z");
  });

  it.each([
    ["no snapshot", null],
    ["another term", snapshot({ termId: "2027-D" })],
    ["older than the daily file", snapshot({ fetchedAt: "2026-10-01T00:00:00Z" })],
    ["no known section", snapshot({ sections: [{ id: "XX 1000-C01", enrolled: 1, capacity: 1, status: "closed", waitlist: { taken: 0, capacity: 0 } }] })],
  ])("gives back the daily file for %s", (_, seats) => {
    const daily = makeTerm();
    const live = withLiveSeats(daily, daily, snapshot()).term;
    expect(withLiveSeats(live, daily, seats)).toEqual({ term: daily, seatsUpdatedAt: daily.generatedAt });
  });
});
