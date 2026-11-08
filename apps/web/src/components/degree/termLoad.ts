import type { RecommendedTerm } from "@/lib/degree/recommendations/planner";
import { unitLabel } from "@/lib/degree/units";

export function termLoad(row: Pick<RecommendedTerm, "existing" | "additions">, selected: readonly string[], cap: number) {
  const chosen = row.additions.filter((choice) => selected.includes(choice.course.code));
  const all = [...row.existing, ...chosen];
  const credits = all.reduce((sum, choice) => sum + choice.course.credits, 0);
  const count = all.length;
  const label = count === 0 ? "No courses yet" : `${count} ${count === 1 ? "course" : "courses"} · ${unitLabel(credits)}`;
  return { label, fill: Math.min(100, Math.round((credits / cap) * 100)), over: credits > cap };
}
