// The engine contract, copied from docs/engine-api.md (version 1). Change that page first, then this file.

import type { Day } from "@/lib/data/types";

export const ENGINE_API_VERSION = 1;

/** Times are minutes after midnight: 600 is 10:00 AM. */
export interface BlockedTime {
  day: Day;
  start: number;
  end: number;
}

export interface Preferences {
  /** Skip options with any meeting that starts earlier. 0 turns it off. */
  startsAfter?: number | null;
  blocked?: BlockedTime[] | null;
  /** Skip options with a full or waitlisted section. */
  onlyOpen?: boolean | null;
  /** Course code → section ids that every kept option must include. */
  locked?: Record<string, string[]> | null;
}

export interface SortWeights {
  earlyCutoff?: number | null;
  perEarlyMinute?: number | null;
  perGapMinute?: number | null;
  perDay?: number | null;
}

export interface Limits {
  /** At most 500. */
  maxSchedules?: number | null;
  /** At most 50,000,000. */
  stepBudget?: number | null;
}

export interface SolveRequest {
  version: typeof ENGINE_API_VERSION;
  courses: string[];
  preferences?: Preferences | null;
  sort?: SortWeights | null;
  limits?: Limits | null;
}

export interface Score {
  total: number;
  earlyMinutes: number;
  gapMinutes: number;
  days: number;
}

export interface ScheduleCourse {
  code: string;
  sections: string[];
  openSeats: number | null;
  /** Every option that meets at exactly the same times, including the one shown. */
  alternatives: string[][];
}

export interface Schedule {
  score: Score;
  courses: ScheduleCourse[];
}

export interface RemovedCounts {
  notLocked: number;
  notOpen: number;
  startsTooEarly: number;
  blocked: number;
}

export interface EmptyCourse {
  code: string;
  optionsInData: number;
  removed: RemovedCounts;
  latestStartsAfter: number | null;
}

export type Fix = { schedules: number; capped: boolean } & (
  | { kind: "relaxStartsAfter"; startsAfter: number }
  | { kind: "clearBlocked" }
  | { kind: "allowFull" }
  | { kind: "unlock"; course: string }
  | { kind: "dropCourse"; course: string }
);

export interface Diagnosis {
  unsure: boolean;
  emptyCourses: EmptyCourse[];
  /** Every pair of courses that never fit together, each as [first, second] in request order. */
  clashingPairs: [string, string][];
  /** Course codes in request order; leaving out any one of them lets the rest fit. */
  minimalClash: string[];
  fixes: Fix[];
}

export interface SolveSuccess {
  ok: true;
  version: typeof ENGINE_API_VERSION;
  termId: string;
  total: number;
  patterns: number;
  capped: boolean;
  steps: number;
  elapsedMs: number;
  schedules: Schedule[];
  /** null whenever total is above 0. */
  diagnosis: Diagnosis | null;
}

export interface LoadTermSuccess {
  ok: true;
  version: typeof ENGINE_API_VERSION;
  termId: string;
  courses: number;
}

export type EngineErrorCode =
  | "noTerm"
  | "badTerm"
  | "badRequest"
  | "unsupportedVersion"
  | "unknownCourse"
  | "unknownSection"
  | "internal";

export interface EngineErrorResponse {
  ok: false;
  version: typeof ENGINE_API_VERSION;
  error: {
    code: EngineErrorCode;
    message: string;
    /** The course code, section id, field or version (as JSON text, like "2") the error is about. */
    detail: string | null;
  };
}

export type LoadTermResponse = LoadTermSuccess | EngineErrorResponse;

export type SolveResponse = SolveSuccess | EngineErrorResponse;
