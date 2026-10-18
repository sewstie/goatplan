import { describe, expect, it } from "vitest";
import type { TermFile } from "@/lib/data";
import { changeLabel, describeChange, findPlanChanges, isSeriousChange } from "./changes";
import { designPlan, termWith } from "./testing";

function editSection(term: TermFile, id: string, edit: (section: TermFile["courses"][number]["sections"][number]) => void) {
  for (const course of term.courses) {
    const section = course.sections.find((item) => item.id === id);
    if (section) edit(section);
  }
  return term;
}

describe("findPlanChanges", () => {
  it("finds nothing when the latest data matches the saved copy", () => {
    const plan = designPlan();
    expect(findPlanChanges(plan, termWith(plan))).toEqual([]);
  });

  it("ignores enrollment changes that keep the same number of open seats", () => {
    const plan = designPlan();
    const term = editSection(termWith(plan), "AE 2410-C01", (section) => {
      section.enrolled += 5;
      section.capacity += 5;
    });
    expect(findPlanChanges(plan, term)).toEqual([]);
  });

  it("flags a different number of open seats", () => {
    const plan = designPlan();
    const term = editSection(termWith(plan), "AE 2320-CX02", (section) => {
      section.enrolled = 38;
    });
    expect(findPlanChanges(plan, term)).toEqual([
      { kind: "seats", course: "AE 2320", section: "CX02", before: 4, after: 2 },
    ]);
  });

  it("flags a section that filled up since the plan was saved", () => {
    const plan = designPlan();
    const term = editSection(termWith(plan), "AE 2320-CX02", (section) => {
      section.enrolled = 41;
      section.status = "closed";
    });
    expect(findPlanChanges(plan, term)).toEqual([{ kind: "filled", course: "AE 2320", section: "CX02" }]);
  });

  it("doesn't flag a section that was already full when saved and still is", () => {
    const plan = designPlan();
    plan.schedule[0].sections[0].enrolled = 40;
    const term = termWith(plan);
    expect(findPlanChanges(plan, term)).toEqual([]);
  });

  it("flags removed sections and removed courses", () => {
    const plan = designPlan();
    const term = termWith(plan);
    term.courses[0].sections = term.courses[0].sections.filter((section) => section.code !== "CX02");
    term.courses = term.courses.filter((course) => course.code !== "AE 2210");
    expect(findPlanChanges(plan, term)).toEqual([
      { kind: "sectionRemoved", course: "AE 2320", section: "CX02" },
      { kind: "courseRemoved", course: "AE 2210" },
    ]);
  });

  it("flags a new meeting time before a seat change, but not a new room", () => {
    const plan = designPlan();
    const term = editSection(termWith(plan), "AE 2320-CX02", (section) => {
      section.meetings = [{ days: ["Thu"], start: 960, end: 1010, location: "Higgins Labs 230" }];
      section.enrolled = 20;
    });
    editSection(term, "AE 2410-C01", (section) => {
      section.meetings[0].location = "Kaven Hall 116";
    });
    expect(findPlanChanges(plan, term)).toEqual([{ kind: "time", course: "AE 2320", section: "CX02" }]);
  });
});

describe("describing changes", () => {
  it("says what changed in plain words", () => {
    expect(describeChange({ kind: "filled", course: "AE 2320", section: "CX02" })).toBe(
      "AE 2320 CX02 filled up since you saved.",
    );
    expect(describeChange({ kind: "seats", course: "AE 2320", section: "CX02", before: 4, after: 1 })).toBe(
      "AE 2320 CX02 has 1 seat open now (was 4).",
    );
    expect(describeChange({ kind: "sectionRemoved", course: "AE 2410", section: "C01" })).toBe("AE 2410 C01 was removed.");
    expect(describeChange({ kind: "courseRemoved", course: "AE 2210" })).toBe("AE 2210 is no longer offered this term.");
    expect(describeChange({ kind: "time", course: "AE 2320", section: "CX02" })).toBe("AE 2320 CX02 meets at a new time.");
    expect(changeLabel({ kind: "filled", course: "AE 2320", section: "CX02" })).toBe("AE 2320 CX02 full");
    expect(changeLabel({ kind: "seats", course: "AE 2320", section: "CX02", before: 4, after: 2 })).toBe(
      "AE 2320 CX02: 2 open (was 4)",
    );
  });

  it("treats only a seat count change as not serious", () => {
    expect(isSeriousChange({ kind: "seats", course: "A", section: "B", before: 2, after: 1 })).toBe(false);
    expect(isSeriousChange({ kind: "filled", course: "A", section: "B" })).toBe(true);
    expect(isSeriousChange({ kind: "time", course: "A", section: "B" })).toBe(true);
    expect(isSeriousChange({ kind: "sectionRemoved", course: "A", section: "B" })).toBe(true);
    expect(isSeriousChange({ kind: "courseRemoved", course: "A" })).toBe(true);
  });
});
