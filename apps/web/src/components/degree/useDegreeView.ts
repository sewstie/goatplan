"use client";

import { useMemo } from "react";
import { applyPins, buildSheet, checkPills, crossListed, creditsPerTerm, estimatePace, hasEnoughDates, parseTerm, type DegreeHistory, type DegreeSnapshot, type PinCourses, type TermName } from "@/lib/degree";
import type { AuditSuccess } from "@/lib/engine/types";
import { hasRegistrationCode } from "@/lib/degree/history";
import { useDegreeUi } from "./degreeUi";

export function pinCourses(history: DegreeHistory): PinCourses {
  const courses = new Map<string, { credits: number; taken: boolean }>();
  for (const course of history.courses.filter((course) => hasRegistrationCode(course.code))) for (const name of crossListed(course.code)) courses.set(name, { credits: course.credits, taken: course.status === "taken" });
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

export function useDegreeView(degree: DegreeSnapshot | null): DegreeView | null {
  const whatIf = useDegreeUi((state) => state.whatIf);
  const openTerm = useMemo(() => {
    const dated = degree?.history.courses.map((course) => parseTerm(course.term)).filter((term) => term !== null) ?? [];
    return dated.sort((a, b) => b.year - a.year || "CDAB".indexOf(b.letter) - "CDAB".indexOf(a.letter))[0] ?? null;
  }, [degree?.history]);

  return useMemo(() => {
    const engineResult = degree?.audit.result;
    if (!degree || !engineResult) return null;
    const courses = pinCourses(degree.history);
    const { result: allocated, pinned } = applyPins(engineResult, degree.history.pins ?? [], courses);
    const result = { ...allocated, extra: [...allocated.extra, ...degree.history.courses.filter((course) => !hasRegistrationCode(course.code)).map((course) => course.code)] };
    const sheet = buildSheet(result, degree.history, pinned, openTerm);
    const credits = creditsPerTerm(degree.history, openTerm);
    const pace = openTerm && hasEnoughDates(credits)
      ? {
          ...estimatePace({ linesToGo: sheet.summary.toGo, coursesPerTerm: whatIf.perTerm, summer: whatIf.summer, openTerm }),
          base: estimatePace({ linesToGo: sheet.summary.toGo, coursesPerTerm: 3, summer: whatIf.summer, openTerm }),
        }
      : null;
    return { result, engineResult, courses, pinnedLines: pinned, sheet, pills: checkPills(result, degree.history), openTerm, credits, pace };
  }, [degree, openTerm, whatIf]);
}
