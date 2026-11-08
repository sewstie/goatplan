import type { DegreeSource } from "../degreeSource";
import type { DegreeHistory, HistoryCourse } from "../history";
import { conflicts } from "./planner";

const courses = (count: number) => `${count} ${count === 1 ? "course" : "courses"}`;
const skippedText = (count: number) => count ? ` ${courses(count)} skipped because you already have them.` : "";

export function applyRecommendation(source: DegreeSource, expected: DegreeHistory, additions: readonly HistoryCourse[]) {
  const current = source.getSnapshot();
  if (current.selectedSheetId !== "cs-2030" || current.sheet?.id !== "cs-2030" || current.history !== expected) return "Your plan changed. Suggest again before adding courses.";
  const accepted: HistoryCourse[] = [];
  let skipped = 0;
  for (const course of additions) {
    if (course.status !== "planned" || !course.term || conflicts(course.code, [...current.history.courses, ...accepted], current.sheet)) skipped++;
    else accepted.push(course);
  }
  if (!accepted.length) return "Nothing added. You already have these courses or ones like them.";
  const result = source.addCourses(accepted);
  if (result.status === "invalid") return "Courses couldn’t be added. Suggest again and try once more.";
  if (result.status === "unsaved") return `${courses(accepted.length)} added for this visit only. Your browser isn’t saving right now.${skippedText(skipped)}`;
  return `${courses(result.added)} added to your plan.${skippedText(skipped + accepted.length - result.added)}`;
}
