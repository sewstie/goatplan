import type { TermFile } from "@/lib/data";
import { hasProfessorChoice } from "@/components/sections/professorChoice";

const STEPS = ["term", "courses", "professor", "availability", "schedules"] as const;
export type GuideStep = typeof STEPS[number];
export type GuideVisit = { step: GuideStep; includesProfessor: boolean };

function visibleSteps(includesProfessor: boolean): readonly GuideStep[] {
  return STEPS.filter((step) => includesProfessor || step !== "professor");
}

export function guideProgress(visit: GuideVisit) {
  const steps = visibleSteps(visit.includesProfessor);
  return { current: Math.max(1, steps.indexOf(visit.step) + 1), total: steps.length };
}

export function advanceGuide(visit: GuideVisit, direction: -1 | 1, includesProfessor: boolean): GuideVisit {
  let index = STEPS.indexOf(visit.step) + direction;
  if (STEPS[index] === "professor" && !includesProfessor) index += direction;
  return { step: STEPS[Math.max(0, Math.min(index, STEPS.length - 1))], includesProfessor };
}

export function professorCourse(term: TermFile | null, courses: readonly string[], selected: string | null): string | null {
  const eligible = courses.filter((code) => term?.courses.some((course) => course.code === code && hasProfessorChoice(course)));
  return eligible.find((code) => code === selected) ?? eligible[0] ?? null;
}

type GuideContext = { hasCourses?: boolean; noMatches?: boolean; phone?: boolean };

export function guideContent(step: GuideStep, { hasCourses = false, noMatches = false, phone = false }: GuideContext = {}) {
  switch (step) {
    case "term": return {
      target: "tutorial-term", title: "Pick your term",
      body: "Your courses and sections come from this term.",
    };
    case "courses": return {
      target: "tutorial-search", title: "Add your courses",
      body: "Search by code, name or professor.",
      hint: hasCourses ? undefined : "Add a course to continue.",
    };
    case "professor": return {
      target: "tutorial-professor", title: "Prefer a professor?",
      body: "Optional. Pick one to see only their lectures.",
    };
    case "availability": return {
      target: "tutorial-block-time", title: "Block busy times",
      body: `${phone ? "Tap Block time" : "Click Block a time"}, then drag across your busy hours.`,
    };
    case "schedules": return noMatches ? {
      target: "tutorial-diagnosis", title: "Nothing fits yet",
      body: "The panel shows why and suggests fixes.",
    } : {
      target: "tutorial-schedules", title: "Compare and save",
      body: "Flip through schedules with the arrows. Save one to get section codes for Workday.",
    };
  }
}
