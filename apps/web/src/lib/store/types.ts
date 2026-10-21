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
  professorByCourse: Record<string, string | null>;
  sortPreset: SortPresetId;
  alternatives: AlternativeChoices;
}

export type TermStatus = "idle" | "loading" | "ready" | "error";

/** "waiting" is the debounce pause before a solve starts. */
export type SolveStatus = "idle" | "waiting" | "solving" | "done" | "error";

/** A plan to open in the planner: a draft without picked alternatives. */
export type OpenedPlan = Omit<Draft, "alternatives">;

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
  lastChosenSections: Record<string, string[]>;
  /** The course the details panel shows. Not saved with the draft. */
  selectedCourse: string | null;
  /** The section whose calendar blocks are selected, a section of selectedCourse. */
  selectedSection: string | null;
}

export interface PlannerActions {
  init(): Promise<void>;
  setTerm(termId: string): Promise<void>;
  /**
   * Switches to the term, replaces the draft with the plan and solves once. Then shows the schedule
   * with the `chosen` sections (course code → section ids) when the answer has one. Resolves to false
   * when the term couldn't load or something else changed the plan first.
   */
  openPlan(termId: string, plan: OpenedPlan, chosen?: Record<string, readonly string[]>): Promise<boolean>;
  addCourse(code: string): void;
  removeCourse(code: string): void;
  selectCourse(code: string | null, sectionId?: string | null): void;
  setPreferences(changes: Partial<PlanPreferences>): void;
  setProfessor(courseCode: string, name: string | null): void;
  lockSection(courseCode: string, sectionId: string): void;
  unlockSection(courseCode: string, sectionId: string): void;
  setSortPreset(preset: SortPresetId): void;
  chooseAlternative(courseCode: string, sectionIds: string[]): void;
  /**
   * Takes this option of the course and keeps the rest of the shown schedule: shows a schedule from
   * the answer that has both, or else locks the option's new sections and solves again.
   */
  pickOption(courseCode: string, sectionIds: readonly string[]): void;
  setScheduleIndex(index: number): void;
  nextSchedule(): void;
  previousSchedule(): void;
  applyFix(fix: Fix): void;
  retrySolve(): Promise<void>;
}

export type PlannerStore = PlannerState & PlannerActions;
