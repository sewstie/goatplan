export interface LineFilter {
  type: "courses" | "subjects" | "subjectMinLevel" | "manual" | "any";
  subject?: string;
  subjects?: string[];
  courses?: string[];
  minLevel?: number;
  additionalCourses?: string[];
  excludedCourses?: string[];
  priority?: number;
  advanced?: boolean;
}

export interface SheetLine {
  line: number;
  section: string;
  name: string;
  units: number;
  filter: LineFilter;
  subSlots?: number;
  subSlotUnits?: number;
  areaTag?: string;
  displayName?: string;
}

export interface SheetSection {
  id: string;
  name: string;
  minUnits: number;
  lines: number[];
  creditPool?: boolean;
  poolCredits?: number;
  displayName?: string;
  note?: string;
}

export interface SheetCheck {
  id: string;
  name: string;
  type: "area" | "disciplineCount" | "groupDepth" | "groupBreadth" | "apIbLimit" | "residency" | "levelLimit" | "graduateEquivalence" | "minCourses" | "manual";
  section?: string;
  courses?: string[];
  externalCourses?: string[];
  disciplines?: string[];
  displayCourses?: number;
  minFromOneDiscipline?: number;
  minCourses?: number;
  confirmation?: string;
  requiresConfirmation?: boolean;
  groupings?: Record<string, string[]>;
  groupingOrder?: string[];
  exceptionGrouping?: string;
  depthCheck?: string;
  allLanguageException?: boolean;
  maxApIb?: number;
  minUnits?: number;
  maxCourses?: number;
  levelCeiling?: number;
  lines?: number[];
  note?: string;
  help?: string;
  affectsLines?: boolean;
  hideWhenEmpty?: boolean;
}

export interface ManualItem {
  id: string;
  line?: number;
  name: string;
  type: "checkbox";
  note?: string;
}

export interface TrackingSheet {
  $schema: string;
  id: string;
  major: string;
  classYear: number;
  catalogYear: string;
  effectiveDate: string;
  source: string;
  catalogSource: string;
  totalUnits: number;
  residencyUnits: number;
  sections: SheetSection[];
  lines: SheetLine[];
  exclusions: { course: string; reason: string }[];
  onlyOneSets: { id: string; courses: string[]; reason: string }[];
  crossLists: string[][];
  checks: SheetCheck[];
  manualItems: ManualItem[];
  huaSubjects: string[];
  orderNote: string;
}
