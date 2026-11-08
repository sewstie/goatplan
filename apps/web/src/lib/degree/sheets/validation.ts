import type { SheetMetadata, TrackingSheet } from "./index";
import Ajv from "ajv";
import schema from "./degree-rules.schema.json";

const validate = new Ajv({ allErrors: true }).compile(schema);

export function validateSheet(value: unknown, metadata: SheetMetadata): string[] {
  if (!validate(value)) return (validate.errors ?? []).map((error) => `${error.dataPath} ${error.message}`);
  const sheet = value as TrackingSheet;
  const problems: string[] = [];
  if (sheet.id !== metadata.id) problems.push("Sheet id does not match the registry");
  if (JSON.stringify(sheet.lines.map((line) => line.line)) !== JSON.stringify(metadata.officialLines)) {
    problems.push("Line numbers do not match the official sheet");
  }
  const total = sheet.lines.reduce((sum, line) => sum + line.units, 0);
  if (Math.abs(total - sheet.totalUnits) > 0.0001) problems.push("Line units do not match totalUnits");
  const lines = new Map(sheet.lines.map((line) => [line.line, line]));
  const sections = new Map(sheet.sections.map((section) => [section.id, section]));
  const checks = new Map(sheet.checks.map((check) => [check.id, check]));
  const manual = new Set(sheet.manualItems.map((item) => item.id));
  for (const [name, ids] of [
    ["sections", sheet.sections.map((section) => section.id)],
    ["checks", sheet.checks.map((check) => check.id)],
    ["manual items", sheet.manualItems.map((item) => item.id)],
    ["only-one sets", sheet.onlyOneSets.map((set) => set.id)],
  ] as const) {
    if (new Set(ids).size !== ids.length) problems.push(`Duplicate ids in ${name}`);
  }
  for (const line of sheet.lines) {
    if (!sections.get(line.section)?.lines.includes(line.line)) problems.push(`Line ${line.line} has no owning section`);
    if (line.areaTag && checks.get(line.areaTag)?.type !== "area") problems.push(`Line ${line.line} has an unknown area`);
    if (line.subSlots && Math.abs(line.subSlots * (line.subSlotUnits ?? 0) - line.units) > 0.0001) {
      problems.push(`Line ${line.line} has inconsistent sub-slot units`);
    }
  }
  for (const section of sheet.sections) {
    if (section.lines.some((line) => !lines.has(line))) problems.push(`Section ${section.id} references an unknown line`);
    const units = section.lines.reduce((sum, id) => sum + (lines.get(id)?.units ?? 0), 0);
    if (Math.abs(units - section.minUnits) > 0.0001) problems.push(`Section ${section.id} has inconsistent units`);
    if (section.creditPool && Math.abs((section.poolCredits ?? 0) / 9 - section.minUnits) > 0.0001) {
      problems.push(`Section ${section.id} has inconsistent pool credits`);
    }
  }
  if (sheet.sections.filter((section) => section.creditPool).length !== 1) problems.push("A sheet needs one free-elective pool");
  for (const item of sheet.manualItems) {
    if (item.line !== undefined && !lines.has(item.line)) problems.push(`Manual item ${item.id} references an unknown line`);
  }
  for (const check of sheet.checks) {
    if (check.section && !sections.has(check.section)) problems.push(`Check ${check.id} references an unknown section`);
    if (check.lines?.some((line) => !lines.has(line))) problems.push(`Check ${check.id} references an unknown line`);
    if (check.confirmation && !manual.has(check.confirmation)) problems.push(`Check ${check.id} references an unknown confirmation`);
    if (check.depthCheck && checks.get(check.depthCheck)?.type !== "groupDepth") problems.push(`Check ${check.id} references an unknown depth check`);
    if (check.groupings) {
      const names = Object.keys(check.groupings).sort();
      if (JSON.stringify(names) !== JSON.stringify([...(check.groupingOrder ?? [])].sort())) problems.push(`Check ${check.id} has incomplete grouping order`);
      if (check.exceptionGrouping && !check.groupings[check.exceptionGrouping]) problems.push(`Check ${check.id} has an unknown exception grouping`);
    }
    if (check.externalCourses?.some((course) => !check.courses?.includes(course))) problems.push(`Check ${check.id} has an unlisted external course`);
  }
  const crossListed = new Set<string>();
  for (const pair of sheet.crossLists) {
    for (const code of pair) {
      if (crossListed.has(code)) problems.push(`Cross-list ${code} appears in more than one pair`);
      crossListed.add(code);
    }
  }
  for (const field of ["major", "classYear", "source", "catalogSource"] as const) {
    if (sheet[field] !== metadata[field]) problems.push(`${field} does not match the registry`);
  }
  if (metadata.status === "checked" && (!metadata.verification?.student.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(metadata.verification.date))) {
    problems.push("Checked sheets need student verification");
  }
  return problems;
}
