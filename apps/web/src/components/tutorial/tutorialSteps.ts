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
      target: "tutorial-term", title: "Choose your term",
      body: "Everything you add belongs to this term. Once its sections load, you can start choosing courses.",
    };
    case "courses": return {
      target: "tutorial-search", title: "Add the courses you need",
      body: "Use the course search by code or professor. Adding a course finds its fitting lecture and lab combinations automatically.",
      hint: hasCourses ? "Great — press Next" : "Add at least one course to continue.",
    };
    case "professor": return {
      target: "tutorial-professor", title: "A professor preference is optional",
      body: "Want a specific professor? Pick them here to see only their lectures. Any professor keeps every option.",
    };
    case "availability": return {
      target: "tutorial-block-time", title: "Make room for your day",
      body: `${phone ? "Tap Block time" : "Press Block a time"}, then drag on the calendar to mark when you’re busy. Drag on a blocked time to erase it.`,
      hint: "Time preferences are optional. Next keeps your current choices.",
    };
    case "schedules": return noMatches ? {
      target: "tutorial-diagnosis", title: "You can finish with no matches",
      body: "Nothing fits right now. The panel shows why and offers fixes — finish the guide and pick one when you’re ready.",
      hint: "Finishing keeps every current preference and lock.",
    } : {
      target: "tutorial-schedules", title: "Browse, inspect, then save if you like",
      body: `Use the arrows to compare returned schedules. ${phone ? "Tap a class or a course chip to see its sections." : "The course panel lists this timetable’s lecture, lab and discussion IDs."} Save a plan to find Sections to register, where you can copy or print the codes for Workday.`,
      hint: "Saving and registering are not required to finish.",
    };
  }
}
