import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREFERENCES,
  draftKey,
  emptyDraft,
  parseDraft,
  readDraft,
  readLastTerm,
  sanitizeDraft,
  writeDraft,
  writeLastTerm,
} from "./draft";
import { MemoryStorage, termFile } from "./testing/fixtures";
import type { Draft } from "./types";

const saved: Draft = {
  courses: ["AE 2320"],
  preferences: { startsAfter: 600, blocked: [{ day: "Fri", start: 840, end: 960 }], onlyOpen: false },
  locks: { "AE 2320": ["AE 2320-CX02"] },
  sortPreset: "fewestGaps",
  alternatives: { "AE 2320-CL01+AE 2320-CX01": { "AE 2320": ["AE 2320-CL01", "AE 2320-CX02"] } },
};

const throwingStorage = {
  getItem(): string {
    throw new Error("blocked");
  },
  setItem(): void {
    throw new Error("quota");
  },
};

describe("draft storage", () => {
  it("uses a versioned key per term", () => {
    expect(draftKey("2027-C")).toBe("goatplan:draft:v1:2027-C");
  });

  it("round-trips a draft", () => {
    const storage = new MemoryStorage();
    writeDraft(storage, "2027-C", saved);
    expect(JSON.parse(storage.getItem("goatplan:draft:v1:2027-C")!)).toMatchObject({ version: 1 });
    expect(readDraft(storage, "2027-C")).toEqual(saved);
    expect(readDraft(storage, "2027-D")).toBeNull();
  });

  it.each([
    ["not JSON", "{oops"],
    ["another version", JSON.stringify({ ...saved, version: 2 })],
    ["no version", JSON.stringify(saved)],
    ["courses not a list", JSON.stringify({ ...saved, version: 1, courses: "AE 2320" })],
    ["a bad time", JSON.stringify({ ...saved, version: 1, preferences: { ...saved.preferences, startsAfter: 2000 } })],
    [
      "a block that ends before it starts",
      JSON.stringify({ ...saved, version: 1, preferences: { ...saved.preferences, blocked: [{ day: "Mon", start: 900, end: 800 }] } }),
    ],
    ["an unknown day", JSON.stringify({ ...saved, version: 1, preferences: { ...saved.preferences, blocked: [{ day: "Xyz", start: 1, end: 2 }] } })],
    ["an unknown sort", JSON.stringify({ ...saved, version: 1, sortPreset: "random" })],
    ["locks not lists", JSON.stringify({ ...saved, version: 1, locks: { "AE 2320": "CX02" } })],
    ["null", "null"],
  ])("ignores broken data: %s", (_, raw) => {
    const storage = new MemoryStorage();
    storage.setItem(draftKey("2027-C"), raw);
    expect(readDraft(storage, "2027-C")).toBeNull();
  });

  it("never throws when storage is blocked or full", () => {
    expect(readDraft(throwingStorage, "2027-C")).toBeNull();
    expect(() => writeDraft(throwingStorage, "2027-C", saved)).not.toThrow();
    expect(readLastTerm(throwingStorage)).toBeNull();
    expect(() => writeLastTerm(throwingStorage, "2027-C")).not.toThrow();
    expect(readDraft(null, "2027-C")).toBeNull();
  });

  it("remembers the last term", () => {
    const storage = new MemoryStorage();
    expect(readLastTerm(storage)).toBeNull();
    writeLastTerm(storage, "2027-D");
    expect(readLastTerm(storage)).toBe("2027-D");
  });

  it("parseDraft copies, so the stored object isn't shared", () => {
    const value = { version: 1, ...saved };
    const draft = parseDraft(value)!;
    draft.courses.push("X");
    expect(value.courses).toEqual(["AE 2320"]);
  });
});

describe("emptyDraft", () => {
  it("starts at 9:00 AM with only open sections, as in the first-visit design", () => {
    expect(emptyDraft().preferences).toEqual(DEFAULT_PREFERENCES);
    expect(DEFAULT_PREFERENCES).toEqual({ startsAfter: 540, blocked: [], onlyOpen: true });
  });
});

describe("sanitizeDraft", () => {
  it("drops courses, locks and choices the term doesn't have", () => {
    const draft: Draft = {
      ...emptyDraft(),
      courses: ["AE 2320", "ZZ 9999", "AE 2320"],
      locks: { "AE 2320": ["AE 2320-CX02", "AE 2320-ZZ99"], "ZZ 9999": ["ZZ 9999-A01"] },
      alternatives: {
        a: { "AE 2320": ["AE 2320-CL01"], "ZZ 9999": ["x"] },
        b: { "ZZ 9999": ["x"] },
      },
    };
    expect(sanitizeDraft(draft, termFile("2027-C"))).toEqual({
      ...emptyDraft(),
      courses: ["AE 2320"],
      locks: { "AE 2320": ["AE 2320-CX02"] },
      alternatives: { a: { "AE 2320": ["AE 2320-CL01"] } },
    });
  });
});
