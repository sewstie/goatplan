import { describe, expect, it } from "vitest";
import type { AuditCheck, AuditLine, AuditSection } from "@/lib/engine/types";
import {
  canConfirmDepth,
  checkHelp,
  checkSentence,
  coursesInDoubt,
  isSmallCourse,
  lineState,
  lineText,
  manualItemForLine,
  sectionProgress,
  shownChecks,
} from "./progress";

const check = (id: string, state: AuditCheck["state"], courses: string[] = [], label = id): AuditCheck => ({ id, label, state, courses });
const line = (id: number, state: AuditLine["state"], course: string | null = null, label = "Computer Science"): AuditLine => ({ id, label, state, course });
const section = (name: string, done: number, planned: number, total: number, lines: AuditLine[] = []): AuditSection => ({ name, done, planned, total, lines });

describe("line text", () => {
  it("names the course and the sheet's line", () => {
    expect(lineText(line(17, "done", "CS 2022"))).toBe("CS 2022 → Computer Science, line 17");
  });

  it("names just the line when nothing fills it", () => {
    expect(lineText(line(18, "empty"))).toBe("Computer Science, line 18");
  });
});

describe("lineState", () => {
  it("passes on the engine's states, with an empty line as missing", () => {
    const none = new Set<string>();
    expect(lineState(line(1, "done", "CS 2022"), none)).toBe("done");
    expect(lineState(line(1, "planned", "CS 2022"), none)).toBe("planned");
    expect(lineState(line(1, "partial"), none)).toBe("partial");
    expect(lineState(line(1, "empty"), none)).toBe("missing");
  });

  it("never shows a course in doubt as done", () => {
    expect(lineState(line(1, "done", "EN 1001"), new Set(["EN 1001"]))).toBe("check");
  });

  it("keeps a planned course in doubt as planned", () => {
    expect(lineState(line(1, "planned", "EN 1001"), new Set(["EN 1001"]))).toBe("planned");
  });
});

describe("coursesInDoubt", () => {
  it("takes the courses behind open depth, breadth, AP/IB and graduate checks", () => {
    const doubted = coursesInDoubt([
      check("hua-depth", "check", ["EN 1001"]),
      check("hua-breadth", "check", ["SP 1001"]),
      check("hua-ap-ib-limit", "check", ["HI 1000"]),
      check("grad-equivalence", "check", ["CS 502"]),
    ]);
    expect([...doubted].sort()).toEqual(["CS 502", "EN 1001", "HI 1000", "SP 1001"]);
  });

  it("leaves out checks that are settled", () => {
    expect(coursesInDoubt([check("hua-depth", "met", ["EN 1001"])]).size).toBe(0);
  });

  it("leaves out a Social Implications course, because the line it fills isn't in question", () => {
    expect(coursesInDoubt([check("social", "check", ["GOV 2314"])]).size).toBe(0);
  });
});

describe("sectionProgress", () => {
  it("counts lines in doubt apart from those that are done", () => {
    const hua = section("Humanities and Arts", 3, 1, 6, [line(1, "done", "EN 1001"), line(2, "done", "EN 1002"), line(3, "done", "WR 1010"), line(4, "planned", "PY 1731")]);
    const checks = [check("hua-depth", "check", ["EN 1001", "EN 1002", "PY 1731"])];
    expect(sectionProgress(hua, checks)).toEqual({ confirmed: 1, inDoubt: 2, planned: 1, open: true, complete: false });
  });

  it("is complete when every line is done and no check is open", () => {
    const math = section("Mathematics", 2, 0, 2, [line(34, "done", "MA 1021"), line(35, "done", "MA 1022")]);
    expect(sectionProgress(math, [check("ma-1000-limit", "met", ["MA 1021"])]).complete).toBe(true);
  });

  it("isn't complete while one of its checks is open, even with every line done", () => {
    const cs = section("Computer Science", 1, 0, 1, [line(16, "done", "CS 1101")]);
    const result = sectionProgress(cs, [check("social", "check", ["GOV 2314"])]);
    expect(result).toMatchObject({ open: true, complete: false, confirmed: 1, inDoubt: 0 });
  });

  it("ignores another section's open check and the residency check", () => {
    const math = section("Mathematics", 1, 0, 1, [line(34, "done", "MA 1021")]);
    expect(sectionProgress(math, [check("social", "check"), check("residency", "check")]).complete).toBe(true);
  });

  it("doesn't count the graduate check as open with no graduate course", () => {
    const cs = section("Computer Science", 1, 0, 1, [line(16, "done", "CS 1101")]);
    expect(sectionProgress(cs, [check("grad-equivalence", "check")])).toMatchObject({ open: false, complete: true });
  });
});

describe("checkSentence", () => {
  it("drops the word 'area' and names the course behind a met check", () => {
    expect(checkSentence(check("systems", "met", ["CS 4513"], "Systems area"))).toBe("Systems: met by CS 4513");
  });

  it("lists several courses", () => {
    expect(checkSentence(check("science-depth", "met", ["PH 1110", "PH 1120"], "Science depth"))).toBe("Science depth: met by PH 1110, PH 1120");
  });

  it("says met on its own when no course is behind it", () => {
    expect(checkSentence(check("hua-ap-ib-limit", "met", [], "AP/IB limit in Humanities"))).toBe("AP/IB limit in Humanities: met");
  });

  it("words the planned, not met and check states", () => {
    expect(checkSentence(check("design", "planned", ["CS 3041"], "Design area"))).toBe("Design: planned with CS 3041");
    expect(checkSentence(check("social", "not-met", [], "Social Implications area"))).toBe("Social Implications: not met yet");
    expect(checkSentence(check("hua-depth", "check", ["EN 1001"], "Humanities depth"))).toBe("Humanities depth: Check this yourself");
  });
});

describe("checkHelp", () => {
  it("explains every check that can ask the student to look for themselves", () => {
    for (const id of ["social", "hua-depth", "hua-breadth", "hua-ap-ib-limit", "residency", "grad-equivalence"]) {
      expect(checkHelp(check(id, "check", ["EN 1001"])), id).toBeTruthy();
    }
  });

  it("says nothing for a settled check", () => {
    expect(checkHelp(check("social", "met", ["CS 3043"]))).toBeNull();
  });

  it("leaves the depth question to the tick box once 3 related courses are there", () => {
    expect(checkHelp(check("hua-depth", "check", ["EN 1001", "EN 1002", "WR 1010"]))).toBeNull();
  });
});

describe("shownChecks", () => {
  it("hides the graduate check when no graduate course is affected", () => {
    expect(shownChecks([check("grad-equivalence", "check"), check("systems", "not-met")]).map((item) => item.id)).toEqual(["systems"]);
  });

  it("keeps the graduate check when a course is affected", () => {
    expect(shownChecks([check("grad-equivalence", "check", ["CS 502"])])).toHaveLength(1);
  });
});

describe("canConfirmDepth", () => {
  it("offers the question for 3 courses in one grouping", () => {
    expect(canConfirmDepth(check("hua-depth", "check", ["EN 1001", "EN 1002", "WR 1010"]))).toBe(true);
  });

  it("keeps the box once it's confirmed, so it can be unticked", () => {
    expect(canConfirmDepth(check("hua-depth", "met", ["EN 1001", "EN 1002", "WR 1010"]))).toBe(true);
    expect(canConfirmDepth(check("hua-depth", "planned", ["EN 1001", "EN 1002", "WR 1010"]))).toBe(true);
  });

  it("doesn't offer it when ticking couldn't change anything", () => {
    expect(canConfirmDepth(check("hua-depth", "check", ["EN 1001", "HI 1330", "PY 1731"]))).toBe(false);
    expect(canConfirmDepth(check("hua-depth", "check", ["EN 1001", "HI 1330"]))).toBe(false);
    expect(canConfirmDepth(check("hua-depth", "not-met"))).toBe(false);
  });
});

describe("manualItemForLine", () => {
  it("has one tick box per IQP and MQP line and one for sports", () => {
    expect([10, 11, 12, 31, 32, 33, 7].map((id) => manualItemForLine(id)?.id)).toEqual(["iqp-1", "iqp-2", "iqp-3", "mqp-1", "mqp-2", "mqp-3", "wpe-sports"]);
  });

  it("has none for an ordinary line", () => {
    expect(manualItemForLine(17)).toBeUndefined();
  });
});

describe("isSmallCourse", () => {
  it("is a course under 3 credits that still counts", () => {
    expect(isSmallCourse(1)).toBe(true);
    expect(isSmallCourse(0.75)).toBe(true);
    expect(isSmallCourse(2.99)).toBe(true);
    expect(isSmallCourse(3)).toBe(false);
    expect(isSmallCourse(0.5)).toBe(false);
    expect(isSmallCourse(0)).toBe(false);
  });
});
