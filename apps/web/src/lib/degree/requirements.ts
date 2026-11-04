import requirements from "./cs-2030.json";

export const REQUIREMENTS_ID = "cs-2030";
export const SHEET_CLASS_YEAR = requirements.classYear;
export const DEPTH_CONFIRMATION = "hua-depth-confirmation";
export const SPORTS_ITEM = "wpe-sports";
export const MANUAL_ITEMS = requirements.manualItems;
export const SECTIONS = requirements.sections;

const depthRule = requirements.checks.find((check) => check.id === "hua-depth");
const breadthRule = requirements.checks.find((check) => check.id === "hua-breadth");

export const DEPTH_COURSES = depthRule?.minCourses ?? 3;
export const HUMANITIES_GROUPINGS: string[][] = Object.values(breadthRule?.groupings ?? {});
