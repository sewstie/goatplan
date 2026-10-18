import type { Section, Term } from "@/lib/data";
import type { PlanPreferences, SortPresetId } from "@/lib/store";

/** A course of the saved schedule, with its own copy of the chosen sections as they were when saved. */
export interface SavedCourse {
  code: string;
  title: string;
  sections: Section[];
}

export interface SavedPlan {
  id: string;
  name: string;
  termId: string;
  term: Pick<Term, "name" | "season" | "year">;
  /** When the plan was last saved, as an ISO date. */
  savedAt: string;
  /** Every course code of the plan, in the order they were added. */
  courses: string[];
  /** The courses of the saved schedule, in plan order. */
  schedule: SavedCourse[];
  /** course code → locked section ids. */
  locks: Record<string, string[]>;
  preferences: PlanPreferences;
  sortPreset: SortPresetId;
}

/** What changed in the latest course data since a plan was saved. */
export type PlanChange =
  | { kind: "courseRemoved"; course: string }
  | { kind: "sectionRemoved"; course: string; section: string }
  | { kind: "filled"; course: string; section: string }
  | { kind: "seats"; course: string; section: string; before: number; after: number }
  | { kind: "time"; course: string; section: string };
