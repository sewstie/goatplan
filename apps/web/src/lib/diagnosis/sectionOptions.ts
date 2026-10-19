import { meetsRules } from "@/lib/data/fit";
import type { Course, Section } from "@/lib/data/types";
import type { PlanPreferences } from "@/lib/store/types";

export function optionSections(course: Course, ids: readonly string[]): Section[] {
  return ids.flatMap((id) => course.sections.find((section) => section.id === id) ?? []);
}

export function lockedOptions(course: Course, locked: readonly string[]): Section[][] {
  return course.options
    .filter((option) => locked.every((id) => option.includes(id)))
    .map((option) => optionSections(course, option));
}

export function availableOptions(course: Course, locked: readonly string[], preferences: PlanPreferences, professor?: string | null): Section[][] {
  return lockedOptions(course, locked).filter((sections) => meetsRules(sections, { ...preferences, professor }));
}

export function commonSections(options: readonly Section[][]): Section[] {
  return (options[0] ?? []).filter((section) => options.every((option) => option.some((item) => item.id === section.id)));
}
