import type { TermFile } from "@/lib/data/types";
import { ENGINE_API_VERSION, type SolveRequest, type SolveSuccess } from "@/lib/engine/types";

export function unavailableProfessorResponse(request: SolveRequest, term: TermFile): SolveSuccess | null {
  const unavailable = Object.entries(request.preferences?.anyOf ?? {}).filter(([, ids]) => ids.length === 0);
  if (unavailable.length === 0) return null;
  return {
    ok: true,
    version: ENGINE_API_VERSION,
    termId: term.term.id,
    total: 0,
    patterns: 0,
    capped: false,
    steps: 0,
    elapsedMs: 0,
    schedules: [],
    diagnosis: {
      unsure: false,
      emptyCourses: unavailable.map(([code]) => {
        const optionsInData = term.courses.find((course) => course.code === code)?.options.length ?? 0;
        return {
          code,
          optionsInData,
          removed: { notAnyOf: optionsInData, notLocked: 0, notOpen: 0, startsTooEarly: 0, blocked: 0 },
          latestStartsAfter: null,
        };
      }),
      clashingPairs: [],
      minimalClash: [],
      fixes: [],
    },
  };
}
