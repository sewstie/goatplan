import { describe, expect, it } from "vitest";
import type { AuditCheck } from "@/lib/engine/types";
import { checkRows, creditsPerTerm } from "./insights";
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

describe("humanities check texts", () => {
  const check = (id: string, state: AuditCheck["state"], courses: string[] = []): AuditCheck => ({ id, label: id, state, courses });
  const text = (checks: AuditCheck[], codes: string[] = []) => {
    const rows = checkRows(checks, { manual: [], courses: codes.map((code) => course(code)) });
    return Object.fromEntries(rows.filter((row) => row.id.startsWith("hua")).map((row) => [row.id, row.text]));
  };

  it("names the courses and grouping the advisor has to look at", () => {
    expect(text([check("hua-depth", "check", ["HI 1310", "HI 2400", "HU 1100"])])["hua-depth"]).toBe("HI 1310, HI 2400 and HU 1100 are all in history and humanities. Ask your advisor if they share one theme, then tick the box.");
    expect(text([check("hua-depth", "check", ["HI 1310", "EN 1001"])])["hua-depth"]).toBe("HI 1310 and EN 1001 are in different groupings. You need 3 related courses in one grouping.");
    expect(text([check("hua-depth", "not-met")])["hua-depth"]).toContain("Or take all 6 humanities courses in one language.");
  });

  it("explains breadth by the depth grouping and the one-language exception", () => {
    expect(text([check("hua-depth", "met", ["HI 1310", "HI 2400", "HU 1100"]), check("hua-breadth", "not-met")])["hua-breadth"]).toBe("Take 1 course outside history and humanities.");
    expect(text([check("hua-breadth", "check")], ["SP 1523", "GN 1511"])["hua-breadth"]).toBe("All your humanities courses are languages. You skip breadth only if all 6 are in one language. Otherwise take 1 course from another grouping.");
    expect(text([check("hua-breadth", "planned", ["PY 1731"])])["hua-breadth"]).toBe("PY 1731 gives you breadth.");
    expect(text([check("hua-depth", "check", ["HI 1310", "EN 1001"]), check("hua-breadth", "check")], ["HI 1310", "EN 1001"])["hua-breadth"]).toBe("Take 3 related courses in one grouping first. Then take 1 course outside your depth grouping.");
    expect(text([check("hua-depth", "met")])["hua-depth"]).toBe("You confirmed your related courses.");
  });
});
