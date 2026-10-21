import type { FitRules } from "@/lib/data";
import type { Course, Section } from "@/lib/data/types";
import { sectionChoices } from "./sectionChoices";
import { sectionsById } from "./sectionDetails";

export interface LabChoices {
  current: Section;
  choices: Section[];
}

export interface SectionSteps {
  currentStep: 1 | 2 | null;
  labs: LabChoices[];
}

export function sectionSteps(course: Course, chosen: readonly string[], locked: readonly string[], rest: readonly Section[], rules: FitRules): SectionSteps {
  const labs: LabChoices[] = sectionsById(course, chosen)
    .filter((section) => section.type === "lab" || section.type === "discussion")
    .map((current) => {
      const kept = [...chosen, ...locked].filter((id) => id !== current.id);
      const options = course.options.filter((option) => option.length === chosen.length
        && kept.every((id) => option.includes(id))
        && option.every((id) => kept.includes(id) || course.sections.some((section) => section.id === id && section.type === current.type)));
      const fitting = sectionChoices({ ...course, options }, chosen, rest, rules);
      return { current, choices: fitting?.others.flatMap((choice) => choice.sections) ?? [] };
    });

  const lectures = course.sections.filter((section) => section.type === "lecture");
  const lectureDone = lectures.length <= 1 || lectures.some((section) => locked.includes(section.id));
  const currentStep = !lectureDone ? 1 : labs.some(({ current }) => !locked.includes(current.id)) ? 2 : null;

  return { currentStep, labs };
}
