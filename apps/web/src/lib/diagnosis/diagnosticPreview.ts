import type { TermFile } from "@/lib/data/types";
import type { DiagnosisContext, DiagnosisIssue } from "./diagnosisText";
import { availableOptions, commonSections, lockedOptions } from "./sectionOptions";
import { hasInstructor } from "@/lib/data/instructors";

export function diagnosticPreview(
  term: TermFile | null,
  codes: readonly string[],
  context: Omit<DiagnosisContext, "term">,
  lastChosen: Readonly<Record<string, readonly string[]>>,
  issues: readonly DiagnosisIssue[],
): Record<string, string[]> {
  if (!term || issues.length === 0) return {};
  const excluded = new Set(issues.flatMap((issue) => issue.excludedSectionIds));
  return Object.fromEntries(codes.flatMap((code) => {
    const course = term.courses.find((item) => item.code === code);
    if (!course) return [];
    const locks = context.locks[code] ?? [];
    const last = lastChosen[code];
    const professor = context.professorByCourse?.[code];
    const taughtByProfessor = (ids: readonly string[]) => !professor || course.sections.some((section) => ids.includes(section.id) && hasInstructor(section, professor));
    const kept = availableOptions(course, locks, context.preferences, professor);
    const options = kept.length > 0 ? kept : lockedOptions(course, locks).filter((sections) => taughtByProfessor(sections.map((section) => section.id)));
    const ids = last?.length && locks.every((id) => last.includes(id)) && taughtByProfessor(last)
      ? last
      : commonSections(options).map((section) => section.id);
    const sections = course.sections.filter((section) => ids.includes(section.id)
      && !excluded.has(section.id)
      && (context.preferences.startsAfter === 0 || section.meetings.every((meeting) => meeting.start >= context.preferences.startsAfter)));
    return [[code, sections.map((section) => section.id)]];
  }));
}
