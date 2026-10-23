import { formatTime, lecturesByProfessor, type Section } from "@/lib/data";
import type { OpenedPlan } from "./types";

const names = new Intl.ListFormat("en-GB", { style: "long", type: "conjunction" });

export function restoredPlanSummary(plan: OpenedPlan, term: { courses: readonly { code: string; sections: Section[] }[] }): string | null {
  if (plan.courses.length === 0) return null;
  const kept: string[] = [];
  if (plan.preferences.startsAfter > 0) kept.push(`${formatTime(plan.preferences.startsAfter).replace(":00", "")} start`);
  kept.push(...new Set(plan.preferences.blocked.flatMap((block) => block.label?.trim() ? [block.label.trim()] : [])));
  for (const code of plan.courses) {
    const course = term.courses.find((item) => item.code === code);
    if (!course) continue;
    const professor = plan.professorByCourse[code];
    if (professor && lecturesByProfessor(course.sections, professor).length > 0 && !kept.includes(professor)) kept.push(professor);
  }
  for (const code of plan.courses) {
    const course = term.courses.find((item) => item.code === code);
    for (const id of new Set(plan.locks[code] ?? [])) {
      const section = course?.sections.find((item) => item.id === id);
      if (section) kept.push(`${section.type} ${section.code}`);
    }
  }
  return kept.length ? `Plan restored · ${names.format(kept)} ${kept.length === 1 ? "is" : "are"} kept.` : "Plan restored.";
}
