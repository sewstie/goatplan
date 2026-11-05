import { describe, expect, it } from "vitest";
import { loadSheet, SHEETS } from "./index";
import { validateSheet } from "./validation";
import { fitsLine } from "../rules";
import { activateRequirements } from "../requirements";
import { checkRows, moveTargets, planningFirst } from "../insights";
import { buildSheet } from "../sheet";
import type { AuditSuccess } from "@/lib/engine/types";

describe("RBE Class of 2030", () => {
  it("shows a matched social implications course even when shared credit can be confirmed manually", async () => {
    activateRequirements(await loadSheet("rbe-2030"));
    const result: AuditSuccess = { ok: true, version: 1, checks: [], sections: [{ name: "Social Implications", done: 1, planned: 0, total: 1, lines: [{ id: 43, label: "Social implications", course: "RBE 3100", state: "done" }] }], freeElectives: { creditsDone: 0, creditsPlanned: 0, creditsTotal: 9, courses: [] }, extra: [], candidateResults: [] };
    const view = buildSheet(result, { courses: [], manual: [] }, new Map(), null);
    expect(view.sections.flatMap((section) => section.tiles).find((line) => line.line === 43)).toMatchObject({ kind: "done", course: "RBE 3100" });
  });
  it("uses RBE line numbers and notes when planning or moving courses", async () => {
    const sheet = await loadSheet("rbe-2030");
    activateRequirements(sheet);
    const result: AuditSuccess = { ok: true, version: 1, checks: [], sections: sheet.sections.map((section) => ({ name: section.name, done: 0, planned: 0, total: section.lines.length, lines: section.lines.map((id) => ({ id, label: "", state: "empty", course: null })) })), freeElectives: { creditsDone: 0, creditsPlanned: 0, creditsTotal: 9, courses: [] }, extra: [], candidateResults: [] };
    const view = buildSheet(result, { courses: [], manual: [] }, new Map(), null);
    expect(planningFirst(view, []).find((item) => item.title === "Inquiry seminar")?.aside).toBe("Line 04");
    expect(planningFirst(view, []).find((item) => item.title === "IQP & MQP")?.aside).toBe("6 lines");
    expect(view.sections.find((section) => section.id === "math")?.note).toContain("Seven math courses");
    expect(moveTargets("MA 2621", 3, view).map((target) => target.line)).toContain(22);
  });
  it("keeps matched controls visibly to check until the interpretation is confirmed", async () => {
    const sheet = await loadSheet("rbe-2030");
    activateRequirements(sheet);
    const result: AuditSuccess = { ok: true, version: 1, checks: [{ id: "classical-controls", label: "Classical controls", state: "check", courses: [] }], sections: [{ name: "Engineering Science", done: 1, planned: 0, total: 2, lines: [{ id: 39, label: "Classical controls", course: "ME 3703", state: "done" }] }], freeElectives: { creditsDone: 0, creditsPlanned: 0, creditsTotal: 9, courses: [] }, extra: [], candidateResults: [] };
    const history = { courses: [{ code: "ME 3703", credits: 3, title: "", inProgress: false, apIb: false, source: "found" as const }], manual: [] };
    const tile = () => buildSheet(result, history, new Map(), null).sections.flatMap((section) => section.tiles).find((line) => line.line === 39);
    expect(tile()?.kind).toBe("check");
    result.checks[0].state = "met";
    expect(tile()?.kind).toBe("done");
  });
  it("shows each interpreted requirement with its source explanation", async () => {
    const sheet = await loadSheet("rbe-2030");
    activateRequirements(sheet);
    const rows = checkRows([{ id: "classical-controls", label: "Classical controls", state: "check", courses: [] }], { courses: [], manual: [] });
    expect(rows.find((row) => row.id === "classical-controls")).toMatchObject({ status: "check", text: expect.stringContaining("The sheet lists ME 3703; the catalog lists AE 2310") });
    expect(rows.some((row) => row.id === "systems")).toBe(false);
  });
  it("uses line 4 for Inquiry and line 6 for the humanities elective", async () => {
    const sheet = await loadSheet("rbe-2030");
    expect(fitsLine("EN 1001", 3, 4, sheet)).toBe(false);
    expect(fitsLine("HU 3900", 3, 4, sheet)).toBe(true);
    expect(fitsLine("EN 1001", 3, 6, sheet)).toBe(true);
  });
  it("loads the official 46-line sheet as an unverified tester beta", async () => {
    const sheet = await loadSheet("rbe-2030");
    const metadata = SHEETS.find((item) => item.id === sheet.id)!;
    expect(metadata).toMatchObject({ major: "Robotics Engineering", status: "beta", verification: null });
    expect(sheet).toMatchObject({ classYear: 2030, catalogYear: "2026-2027", totalUnits: 46 / 3,
      source: "https://www.wpi.edu/sites/default/files/2026-05/RBE-2030_fillable.pdf",
      catalogSource: "https://wpi.cleancatalog.net/robotics-engineering/robotics-engineering-major" });
    expect(sheet.lines.map((line) => line.line)).toEqual(Array.from({ length: 46 }, (_, index) => index + 1));
    expect(validateSheet(sheet, metadata)).toEqual([]);
  });
});
