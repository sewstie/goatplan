import { meetingSpans, meetsRules, sectionTypeName, spansOverlap, type Span } from "@/lib/data";
import type { Course, Section, SectionType } from "@/lib/data/types";
import type { PlanPreferences } from "@/lib/store/types";

export type CourseFit =
  | { kind: "fits" }
  | { kind: "clash"; course: string; sectionType: SectionType }
  | { kind: "full" };

export interface FitPlan {
  /** The planned courses, in plan order. */
  courses: readonly Course[];
  /** Course code → the section ids taken in the schedule on screen. Empty when no schedule is shown. */
  chosen: Readonly<Record<string, readonly string[]>>;
  locks: Readonly<Record<string, readonly string[]>>;
  preferences: PlanPreferences;
}

function sectionsOf(course: Course, ids: readonly string[]): Section[] {
  return ids.flatMap((id) => course.sections.find((section) => section.id === id) ?? []);
}

/** The options the engine would keep for this course, with the same rules as its filters. */
function keptOptions(course: Course, preferences: PlanPreferences, locked: readonly string[]): Section[][] {
  return course.options
    .filter((option) => locked.every((id) => option.includes(id)))
    .map((option) => sectionsOf(course, option))
    .filter((sections) => meetsRules(sections, preferences));
}

/** The type of the planned section that most of the new course's options run into. */
function clashingType(ours: readonly Span[][], theirs: readonly Section[]): SectionType {
  let best = theirs[0];
  let bestCount = -1;
  for (const section of theirs) {
    const own = meetingSpans([section]);
    const count = ours.filter((option) => spansOverlap(option, own)).length;
    if (count > bestCount) {
      best = section;
      bestCount = count;
    }
  }
  return best.type;
}

/**
 * Whether a course from the search can join the plan, checked in TypeScript before adding it:
 * - "fits" when one of its options fits around the schedule on screen (or the plan is empty);
 * - "clash" when every option overlaps every option of one planned course;
 * - "full" when every option has a full section and "Only open sections" is on.
 * Null when it can't tell without the engine, like when it only fits with other sections of planned courses.
 */
export function courseFit(course: Course, plan: FitPlan): CourseFit | null {
  const kept = keptOptions(course, plan.preferences, []);
  if (kept.length === 0) {
    const allFull =
      plan.preferences.onlyOpen &&
      course.options.length > 0 &&
      course.options.every((option) => sectionsOf(course, option).some((section) => section.status !== "open"));
    return allFull ? { kind: "full" } : null;
  }
  if (plan.courses.length === 0) return { kind: "fits" };

  const ours = kept.map(meetingSpans);
  const scheduled = plan.courses.every((planned) => (plan.chosen[planned.code]?.length ?? 0) > 0);
  if (scheduled) {
    const busy = meetingSpans(plan.courses.flatMap((planned) => sectionsOf(planned, plan.chosen[planned.code])));
    if (ours.some((option) => !spansOverlap(option, busy))) return { kind: "fits" };
  }

  for (const planned of plan.courses) {
    const theirOptions = keptOptions(planned, plan.preferences, plan.locks[planned.code] ?? []);
    if (theirOptions.length === 0) continue;
    const theirs = theirOptions.map(meetingSpans);
    if (ours.every((option) => theirs.every((other) => spansOverlap(option, other)))) {
      const shown = sectionsOf(planned, plan.chosen[planned.code] ?? []);
      const candidates = shown.length > 0 ? shown : [...new Set(theirOptions.flat())];
      return { kind: "clash", course: planned.code, sectionType: clashingType(ours, candidates) };
    }
  }
  return null;
}

/** "Fits", "Clashes with AE 2320 lecture", "All sections full" */
export function fitText(fit: CourseFit): string {
  switch (fit.kind) {
    case "fits":
      return "Fits";
    case "full":
      return "All sections full";
    case "clash":
      return fit.sectionType === "other"
        ? `Clashes with ${fit.course}`
        : `Clashes with ${fit.course} ${sectionTypeName(fit.sectionType).toLowerCase()}`;
  }
}
