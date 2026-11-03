import type { TermFile } from "@/lib/data/types";
import type { SavedPlan } from "@/lib/plans/types";
import { sanitizeDraft } from "@/lib/store/draft";
import type { SharedPlan } from "./codec";

export interface MissingItem {
  course: string;
  /** The section's own code, or null when the whole course is gone. */
  section: string | null;
  sectionType: string | null;
}

export function buildSharedPlan(plan: SharedPlan, term: TermFile) {
  const warnings: string[] = [];
  const missing: MissingItem[] = [];
  const schedule = plan.courses.flatMap((code) => {
    const course = term.courses.find((item) => item.code === code);
    if (!course) {
      warnings.push(`${code} is no longer offered.`);
      missing.push({ course: code, section: null, sectionType: null });
      return [];
    }
    const sections = (plan.chosen[code] ?? []).flatMap((id) => {
      const section = course.sections.find((item) => item.id === id);
      if (!section) {
        const short = id.startsWith(`${code}-`) ? id.slice(code.length + 1) : id;
        warnings.push(`${code} ${short} is no longer offered.`);
        missing.push({ course: code, section: short, sectionType: /^(CX|X|L[A-Z]?\d)/.test(short) ? "lab" : "section" });
      }
      return section ?? [];
    });
    return [{ code, title: course.title, sections }];
  });
  const { courses, locks, professorByCourse } = sanitizeDraft({ ...plan, alternatives: {} }, term);
  const view: SavedPlan = {
    id: "__temporary__",
    name: `${term.term.name} · Shared copy`,
    termId: plan.termId,
    term: { name: term.term.name, season: term.term.season, year: term.term.year },
    savedAt: term.generatedAt,
    courses,
    schedule,
    locks,
    professorByCourse,
    preferences: plan.preferences,
    sortPreset: plan.sortPreset,
  };
  return { ...plan, courses, locks, professorByCourse, view, warnings, missing };
}
