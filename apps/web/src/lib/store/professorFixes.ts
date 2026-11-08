import { lectureInstructors, lecturesByProfessor } from "@/lib/data/instructors";
import type { TermFile } from "@/lib/data/types";
import type { SolveRequest, SolveResponse } from "@/lib/engine/types";
import type { ProfessorFix } from "./types";

/** Enough to cover almost every course without making the student wait. */
const MAX_PER_COURSE = 6;

/**
 * For each course with a chosen professor, tries every other lecture professor in its place and keeps
 * the ones that give schedules, most schedules first. Each try runs alone, with everything else in the
 * request unchanged. `stillWanted` stops it early once the answer is no longer needed.
 */
export async function findProfessorFixes(
  request: SolveRequest,
  term: TermFile,
  professorByCourse: Readonly<Record<string, string | null>>,
  solve: (request: SolveRequest) => Promise<SolveResponse>,
  stillWanted: () => boolean = () => true,
): Promise<ProfessorFix[]> {
  const found: ProfessorFix[] = [];
  for (const code of request.courses) {
    const chosen = professorByCourse[code];
    const course = term.courses.find((item) => item.code === code);
    if (!chosen || !course) continue;
    const others = lectureInstructors(course.sections)
      .filter((name) => name.toLowerCase() !== chosen.trim().toLowerCase())
      .slice(0, MAX_PER_COURSE);
    const fixes: ProfessorFix[] = [];
    for (const professor of others) {
      if (!stillWanted()) return found;
      const anyOf = { ...request.preferences?.anyOf, [code]: lecturesByProfessor(course.sections, professor).map((section) => section.id) };
      const answer = await solve({
        ...request,
        preferences: { ...request.preferences, anyOf },
        limits: { ...request.limits, maxSchedules: 1 },
      });
      if (answer.ok && answer.total > 0) fixes.push({ kind: "switchProfessor", course: code, professor, schedules: answer.total, capped: answer.capped });
    }
    found.push(...fixes.sort((a, b) => b.schedules - a.schedules));
  }
  return found;
}
