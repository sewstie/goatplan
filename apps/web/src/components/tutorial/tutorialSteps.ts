import { formatTime, type TermFile } from "@/lib/data";
import type { PlanPreferences } from "@/lib/store";
import { groupBlocked, groupDays, groupTimes } from "@/components/preferences/blockedTimes";

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
  const eligible = courses.filter((code) => term?.courses.some((course) => course.code === code && course.sections.some((section) => section.type === "lecture")));
  return eligible.find((code) => code === selected) ?? eligible[0] ?? null;
}

export function availabilityDescription(preferences: PlanPreferences): string {
  const groups = groupBlocked(preferences.blocked);
  const start = preferences.startsAfter === 0 ? "Any time" : `${formatTime(preferences.startsAfter).replace(":00", "")} start`;
  const blocks = groups.map((group) => group.label?.toLowerCase() === "lunch" ? "lunch break" : `${group.label ? `“${group.label}” ` : ""}block (${groupDays(group)} ${groupTimes(group)})`);
  const settings = blocks.length > 0
    ? `Your ${start} and ${blocks.join(" and ")} are already applied.`
    : preferences.startsAfter === 0 ? "Your start is set to Any time, with no blocked time." : `Your ${start} is already applied, with no blocked time.`;
  return `${settings} You can change these controls or keep them and continue. Only open sections is ${preferences.onlyOpen ? "on" : "off"}.`;
}

export function guideContent(step: GuideStep, preferences: PlanPreferences, noMatches = false) {
  switch (step) {
    case "term": return {
      target: "tutorial-term", title: "Choose your term",
      body: "Everything you add belongs to this term. Once its sections load, you can start choosing courses.",
    };
    case "courses": return {
      target: "tutorial-search", title: "Add the courses you need",
      body: "Use the course search by code or professor. Adding a course finds its fitting lecture and lab combinations automatically.",
      hint: "Add at least one course to continue.",
    };
    case "professor": return {
      target: "tutorial-professor", title: "A professor preference is optional",
      body: "Use Lecture professor to narrow this course’s lectures. Any professor keeps every eligible lecture time; compatible labs can have another instructor.",
    };
    case "availability": return {
      target: "tutorial-preferences", title: "Make room for your day",
      body: availabilityDescription(preferences),
      hint: "Time preferences are optional. Next keeps your current choices.",
    };
    case "schedules": return noMatches ? {
      target: "tutorial-schedules", title: "You can finish with no matches",
      body: "This lecture starts before your chosen time. Finish the guide whenever you’re ready, then use an explicit fix if you want to change that restriction.",
      hint: "Finishing keeps every current preference and lock.",
    } : {
      target: "tutorial-schedules", title: "Browse, inspect, then save if you like",
      body: "Use the arrows to compare returned schedules. The course panel lists this timetable’s lecture, lab and discussion IDs. Save a plan to find Sections to register, where you can copy or print the codes for Workday.",
      hint: "Saving and registering are not required to finish.",
    };
  }
}
