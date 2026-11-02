"use client";

import { useMemo } from "react";
import { applyPins, buildSheet, checkPills, crossListed, creditsPerTerm, estimatePace, hasEnoughDates, parseTerm, type DegreeHistory, type DegreeSnapshot, type PinCourses, type TermName } from "@/lib/degree";
import type { AuditCourse, AuditSuccess } from "@/lib/engine/types";
import { usePlanner } from "@/lib/store";
import { useDegreeUi } from "./degreeUi";

export function pinCourses(history: DegreeHistory, plan: readonly AuditCourse[]): PinCourses {
  const courses = new Map<string, { credits: number; taken: boolean }>();
  for (const { code, credits } of plan) for (const name of crossListed(code)) courses.set(name, { credits, taken: false });
  for (const course of history.courses) for (const name of crossListed(course.code)) courses.set(name, { credits: course.credits, taken: !course.inProgress });
  return courses;
}

export interface DegreeView {
  result: AuditSuccess;
  engineResult: AuditSuccess;
  courses: PinCourses;
  pinnedLines: ReadonlyMap<number, string>;
  sheet: ReturnType<typeof buildSheet>;
  pills: ReturnType<typeof checkPills>;
  openTerm: TermName | null;
  credits: ReturnType<typeof creditsPerTerm>;
  pace: { finish: TermName; terms: number; base: { finish: TermName; terms: number } } | null;
}

/** The audit as the student sees it: the engine's best fit with their pins on top, in the sheet's own terms. */
export function useDegreeView(degree: DegreeSnapshot | null): DegreeView | null {
  const termId = usePlanner((state) => state.termId);
  const whatIf = useDegreeUi((state) => state.whatIf);
  const openTerm = useMemo(() => parseTerm(termId), [termId]);

  return useMemo(() => {
    const engineResult = degree?.audit.result;
    if (!degree || !engineResult) return null;
    const courses = pinCourses(degree.history, degree.planCourses);
    const { result, pinned } = applyPins(engineResult, degree.history.pins ?? [], courses);
    const sheet = buildSheet(result, degree.history, pinned, openTerm);
    const credits = creditsPerTerm(degree.history, degree.planCourses, openTerm);
    const pace = openTerm && hasEnoughDates(credits)
      ? {
          ...estimatePace({ linesToGo: sheet.summary.toGo, coursesPerTerm: whatIf.perTerm, summer: whatIf.summer, openTerm }),
          base: estimatePace({ linesToGo: sheet.summary.toGo, coursesPerTerm: 3, summer: whatIf.summer, openTerm }),
        }
      : null;
    return { result, engineResult, courses, pinnedLines: pinned, sheet, pills: checkPills(result, degree.history), openTerm, credits, pace };
  }, [degree, openTerm, whatIf]);
}
