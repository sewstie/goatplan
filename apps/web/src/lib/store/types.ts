import type { TermFile, TermSummary } from "@/lib/data/types";
import type { BlockedTime, Fix, SolveResponse } from "@/lib/engine/types";
import type { SavedPlan } from "@/lib/plans/types";

export type SortPresetId = "bestOverall" | "fewestEarly" | "latestStart" | "earliestFinish" | "fewestDays" | "fewestGaps";

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

/** What undoRemoveCourse puts back: the last removed course as it was in the draft. */
export interface RemovedCourse {
  code: string;
  /** Its position in `courses`. */
  index: number;
  /** Its locked section ids, or undefined when it had none. */
  locks: string[] | undefined;
  /** Its professor entry: a name, null for Any professor, or undefined when it had no entry. */
  professor: string | null | undefined;
  /** schedule key → the section ids of the alternative picked for this course there. */
  alternatives: Record<string, string[]>;
  /** Whether it was the selected course. */
  wasSelected: boolean;
}

export interface PlannerState extends Draft {
  savedPlans: SavedPlan[];
  savedPlanId: string | null;
  savedSelectedCourse: string | null;
  savedSelectedSection: string | null;
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
  /**
   * The last removed course, until another change to the draft. Selecting a course or paging schedules
   * keeps it. Not saved with the draft or with plans.
   */
  removedCourse: RemovedCourse | null;
}

export interface PlannerActions {
  setSavedPlans(plans: SavedPlan[]): void;
  showFound(): void;
  showSaved(id?: string): void;
  nextSavedPlan(): void;
  previousSavedPlan(): void;
  init(): Promise<void>;
  setTerm(termId: string): Promise<void>;
  /**
   * Switches to the term, replaces the draft with the plan and solves once. Then shows the schedule
   * with the `chosen` sections (course code → section ids) when the answer has one. Resolves to false
   * when the term couldn't load or something else changed the plan first.
   */
  openPlan(termId: string, plan: OpenedPlan, chosen?: Record<string, readonly string[]>): Promise<boolean>;
  addCourse(code: string): void;
  /** Removes a course and keeps it in removedCourse, replacing an earlier one, so it can be undone. */
  removeCourse(code: string): void;
  /** Puts removedCourse back as it was, reselects it if it was selected, and solves once. */
  undoRemoveCourse(): void;
  /** Forgets removedCourse without changing the plan. */
  dismissRemovedCourse(): void;
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
