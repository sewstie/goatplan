import type { TermFile } from "@/lib/data/types";
import type { SolveRequest } from "@/lib/engine/types";

export type PresetName = "basic" | "nothingFits" | "large";

export const PRESET_LABELS: Record<PresetName, string> = {
  basic: "Basic",
  nothingFits: "Nothing fits",
  large: "Large",
};

/** Requests built from the loaded term, so they keep working when the published terms change. */
export function buildPresets(term: TermFile): Record<PresetName, SolveRequest> {
  const byOptions = term.courses
    .filter((course) => course.sections.some((section) => section.meetings.length > 0))
    .toSorted((a, b) => b.options.length - a.options.length)
    .map((course) => course.code);

  return {
    basic: { version: 1, courses: byOptions.slice(0, 3), limits: { maxSchedules: 5 } },
    nothingFits: { version: 1, courses: byOptions.slice(0, 3), preferences: { startsAfter: 1430 } },
    large: {
      version: 1,
      courses: byOptions.slice(0, 7),
      limits: { maxSchedules: 500, stepBudget: 50_000_000 },
    },
  };
}
