import { openSeats, type Meeting, type Section, type TermFile } from "@/lib/data";
import type { PlanChange, SavedPlan } from "./types";

const sameMeetingTimes = (a: readonly Meeting[], b: readonly Meeting[]) =>
  a.length === b.length &&
  a.every(
    (meeting, index) =>
      meeting.start === b[index].start &&
      meeting.end === b[index].end &&
      meeting.days.join() === b[index].days.join(),
  );

/** The change for one saved section, or null if its seats and times are the same as when saved. */
export function sectionChange(course: string, saved: Section, latest: Section | undefined): PlanChange | null {
  if (!latest) return { kind: "sectionRemoved", course, section: saved.code };
  if (!sameMeetingTimes(saved.meetings, latest.meetings)) return { kind: "time", course, section: saved.code };
  const before = openSeats(saved);
  const after = openSeats(latest);
  if (before > 0 && after === 0) return { kind: "filled", course, section: saved.code };
  if (before !== after) return { kind: "seats", course, section: saved.code, before, after };
  return null;
}

/** Compares a plan's own copy of its sections with the latest term data. */
export function findPlanChanges(plan: SavedPlan, term: TermFile): PlanChange[] {
  const courses = new Map(term.courses.map((course) => [course.code, course]));
  const changes: PlanChange[] = [];
  for (const saved of plan.schedule) {
    const course = courses.get(saved.code);
    if (!course) {
      changes.push({ kind: "courseRemoved", course: saved.code });
      continue;
    }
    for (const section of saved.sections) {
      const change = sectionChange(saved.code, section, course.sections.find((item) => item.id === section.id));
      if (change) changes.push(change);
    }
  }
  return changes;
}

/** Changes that can break the plan. A different seat count alone still leaves a seat to register for. */
export function isSeriousChange(change: PlanChange): boolean {
  return change.kind !== "seats";
}

/** One sentence for the student, like "AE 2320 CX02 filled up since you saved." */
export function describeChange(change: PlanChange): string {
  switch (change.kind) {
    case "courseRemoved":
      return `${change.course} is no longer offered this term.`;
    case "sectionRemoved":
      return `${change.course} ${change.section} was removed.`;
    case "filled":
      return `${change.course} ${change.section} filled up since you saved.`;
    case "seats":
      return `${change.course} ${change.section} has ${seatCount(change.after)} open now (was ${change.before}).`;
    case "time":
      return `${change.course} ${change.section} meets at a new time.`;
  }
}

/** A short label for badges, like "CX02 full". */
export function changeLabel(change: PlanChange): string {
  switch (change.kind) {
    case "courseRemoved":
      return `${change.course} removed`;
    case "sectionRemoved":
      return `${change.course} ${change.section} removed`;
    case "filled":
      return `${change.course} ${change.section} full`;
    case "seats":
      return `${change.course} ${change.section}: ${change.after} open (was ${change.before})`;
    case "time":
      return `${change.course} ${change.section} new time`;
  }
}

/** A label for the section's own row, where the course and section are already shown. */
export function rowChangeLabel(change: PlanChange): string {
  switch (change.kind) {
    case "courseRemoved":
    case "sectionRemoved":
      return "No longer offered";
    case "filled":
      return "Filled up since you saved";
    case "seats":
      return `Was ${change.before} open`;
    case "time":
      return "New time since you saved";
  }
}

function seatCount(count: number): string {
  return count === 1 ? "1 seat" : `${count} seats`;
}
