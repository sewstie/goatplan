import { describe, expect, it } from "vitest";
import { creditsPerTerm } from "./insights";
import type { HistoryCourse } from "./history";

const course = (code: string, extra: Partial<HistoryCourse> = {}): HistoryCourse => ({ code, title: "", credits: 3, status: "taken", apIb: false, source: "found", ...extra });

describe("credits per term", () => {
  it("keeps AP, IB and transfer credit apart from WPI courses that still need a term", () => {
    const credits = creditsPerTerm({ manual: [], courses: [
      course("CS 1101", { term: "A Term 2026" }),
      course("MA 1021", { apIb: true, creditSource: "ap" }),
      course("BB 1000", { apIb: true, creditSource: "ib" }),
      course("CH 1010", { creditSource: "transfer", source: "typed" }),
      course("CS 2102"),
    ] }, null);
    expect(credits.prior).toMatchObject({ label: "AP, IB and transfer", done: 9, planned: 0 });
    expect(credits.noTerm).toMatchObject({ done: 3, planned: 0 });
    expect(credits.undated).toBe(1);
  });
});
