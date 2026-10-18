import type { TermFile, TermSummary } from "@/lib/data/types";
import type { BlockedTime, Fix, SolveResponse } from "@/lib/engine/types";

export type SortPresetId = "fewestEarly" | "fewestGaps" | "fewestDays";

/** A blocked time with the name the student gave it, like "Work". The name never goes to the engine. */
export interface PlanBlockedTime extends BlockedTime {
  label?: string;
}

export interface PlanPreferences {
  /** Minutes after midnight; 0 turns the rule off. */
  startsAfter: number;
  blocked: PlanBlockedTime[];
  onlyOpen: boolean;
}

/** schedule key → course code → the section ids of the alternative the student picked. */
export type AlternativeChoices = Record<string, Record<string, string[]>>;

/** The part of the state saved per term in localStorage. */
export interface Draft {
  /** Course codes, in the order they were added. */
  courses: string[];
  preferences: PlanPreferences;
  /** course code → locked section ids. */
  locks: Record<string, string[]>;
  sortPreset: SortPresetId;
  alternatives: AlternativeChoices;
}

export type TermStatus = "idle" | "loading" | "ready" | "error";

/** "waiting" is the debounce pause before a solve starts. */
export type SolveStatus = "idle" | "waiting" | "solving" | "done" | "error";

export interface PlannerState extends Draft {
  terms: TermSummary[];
  termId: string | null;
  term: TermFile | null;
  termStatus: TermStatus;
  termError: string | null;
  response: SolveResponse | null;
  scheduleIndex: number;
  solveStatus: SolveStatus;
  solveError: string | null;
}

export interface PlannerActions {
  init(): Promise<void>;
  setTerm(termId: string): Promise<void>;
  addCourse(code: string): void;
  removeCourse(code: string): void;
  setPreferences(changes: Partial<PlanPreferences>): void;
  lockSection(courseCode: string, sectionId: string): void;
  unlockSection(courseCode: string, sectionId: string): void;
  setSortPreset(preset: SortPresetId): void;
  chooseAlternative(courseCode: string, sectionIds: string[]): void;
  nextSchedule(): void;
  previousSchedule(): void;
  applyFix(fix: Fix): void;
}

export type PlannerStore = PlannerState & PlannerActions;
