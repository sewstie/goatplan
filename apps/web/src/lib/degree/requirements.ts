import { DEFAULT_SHEET_ID, loadSheet, SHEETS, type TrackingSheet } from "./sheets";
import type { ManualItem, SheetSection } from "./sheets/types";

export const REQUIREMENTS_ID = DEFAULT_SHEET_ID;
export const SHEET_CLASS_YEAR = SHEETS[0].classYear;
export let DEPTH_CONFIRMATION = "";
export let SPORTS_ITEM = "";
export let MANUAL_ITEMS: ManualItem[] = [];
export let SECTIONS: SheetSection[] = [];
export let DEPTH_COURSES = 0;
export let HUMANITIES_GROUPINGS: string[][] = [];
export let FREE_ELECTIVE_LINES: number[] = [];
export let MAJOR_LINES: number[] = [];
export let WPE_LINE = 0;
export let AREA_CHECK_IDS: string[] = [];
let selected: TrackingSheet | null = null;

export const loadedRequirements = () => selected;

export function getRequirements(): TrackingSheet {
  if (!selected) throw new Error("The tracking sheet has not loaded");
  return selected;
}

export async function loadRequirements(id = DEFAULT_SHEET_ID): Promise<TrackingSheet> {
  const sheet = await loadSheet(id);
  selected = sheet;
  MANUAL_ITEMS = sheet.manualItems;
  SECTIONS = sheet.sections;
  const depth = sheet.checks.find((check) => check.type === "groupDepth");
  const breadth = sheet.checks.find((check) => check.type === "groupBreadth");
  DEPTH_CONFIRMATION = depth?.confirmation ?? "";
  DEPTH_COURSES = depth?.minCourses ?? 0;
  HUMANITIES_GROUPINGS = (breadth?.groupingOrder ?? []).map((name) => breadth?.groupings?.[name] ?? []);
  const slots = sheet.lines.find((line) => line.subSlots);
  WPE_LINE = slots?.line ?? 0;
  SPORTS_ITEM = sheet.manualItems.find((item) => item.line === WPE_LINE)?.id ?? "";
  FREE_ELECTIVE_LINES = sheet.sections.filter((section) => section.creditPool).flatMap((section) => section.lines);
  const areaSections = new Set(sheet.checks.filter((check) => check.type === "area").map((check) => check.section));
  MAJOR_LINES = sheet.sections.filter((section) => areaSections.has(section.id)).flatMap((section) => section.lines);
  AREA_CHECK_IDS = sheet.checks.filter((check) => check.type === "area").map((check) => check.id);
  return sheet;
}
