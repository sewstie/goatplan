import { sectionTypeName } from "@/lib/data";
import type { Course, Day, Section, SectionType } from "@/lib/data/types";
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

// The engine compares times in 5-minute slots, so these checks do too.
const SLOT = 5;

type Span = { day: Day; first: number; pastLast: number };

function spans(sections: readonly Section[]): Span[] {
  return sections.flatMap((section) =>
    section.meetings.flatMap((meeting) =>
      meeting.days.map((day) => ({
        day,
        first: Math.floor(meeting.start / SLOT),
        pastLast: Math.ceil(meeting.end / SLOT),
      })),
    ),
  );
}

function overlaps(a: readonly Span[], b: readonly Span[]): boolean {
  return a.some((x) => b.some((y) => x.day === y.day && x.first < y.pastLast && y.first < x.pastLast));
}

function sectionsOf(course: Course, ids: readonly string[]): Section[] {
  return ids.flatMap((id) => course.sections.find((section) => section.id === id) ?? []);
}

/** The options the engine would keep for this course, with the same rules as its filters. */
function keptOptions(course: Course, preferences: PlanPreferences, locked: readonly string[]): Section[][] {
  const blocked: Span[] = preferences.blocked.map((time) => ({
    day: time.day,
    first: Math.floor(time.start / SLOT),
    pastLast: Math.ceil(time.end / SLOT),
  }));
  return course.options
    .filter((option) => locked.every((id) => option.includes(id)))
    .map((option) => sectionsOf(course, option))
    .filter(
      (sections) =>
        !(preferences.onlyOpen && sections.some((section) => section.status !== "open")) &&
        !(
          preferences.startsAfter !== 0 &&
          sections.some((section) => section.meetings.some((meeting) => meeting.start < preferences.startsAfter))
        ) &&
        !overlaps(spans(sections), blocked),
    );
}

/** The type of the planned section that most of the new course's options run into. */
function clashingType(ours: readonly Span[][], theirs: readonly Section[]): SectionType {
  let best = theirs[0];
  let bestCount = -1;
  for (const section of theirs) {
    const own = spans([section]);
    const count = ours.filter((option) => overlaps(option, own)).length;
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

  const ours = kept.map(spans);
  const scheduled = plan.courses.every((planned) => (plan.chosen[planned.code]?.length ?? 0) > 0);
  if (scheduled) {
    const busy = spans(plan.courses.flatMap((planned) => sectionsOf(planned, plan.chosen[planned.code])));
    if (ours.some((option) => !overlaps(option, busy))) return { kind: "fits" };
  }

  for (const planned of plan.courses) {
    const theirOptions = keptOptions(planned, plan.preferences, plan.locks[planned.code] ?? []);
    if (theirOptions.length === 0) continue;
    const theirs = theirOptions.map(spans);
    if (ours.every((option) => theirs.every((other) => overlaps(option, other)))) {
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
