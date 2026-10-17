import type { Day } from "./types";

export const WEEK: readonly Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const DAY_NAMES: Readonly<Record<Day, string>> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

/**
 * ["Mon", "Thu"] → "Mon, Thu". Three or more days in a row collapse:
 * ["Mon", "Tue", "Wed", "Thu", "Fri"] → "Mon–Fri", ["Mon", "Tue", "Wed", "Fri"] → "Mon–Wed, Fri".
 */
export function formatDays(days: readonly Day[]): string {
  const indexes = [...new Set(days.map((day) => WEEK.indexOf(day)))]
    .filter((index) => index >= 0)
    .sort((a, b) => a - b);

  const runs: number[][] = [];
  for (const index of indexes) {
    const run = runs.at(-1);
    if (run && run.at(-1) === index - 1) run.push(index);
    else runs.push([index]);
  }

  return runs
    .flatMap((run) =>
      run.length >= 3 ? [`${WEEK[run[0]]}–${WEEK[run.at(-1)!]}`] : run.map((index) => WEEK[index]),
    )
    .join(", ");
}
