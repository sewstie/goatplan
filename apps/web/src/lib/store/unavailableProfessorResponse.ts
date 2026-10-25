import type { TermFile } from "@/lib/data/types";
import { ENGINE_API_VERSION, type Fix, type SolveRequest, type SolveResponse, type SolveSuccess } from "@/lib/engine/types";

/**
 * The answer when a chosen professor teaches no lecture of a course this term. Its `anyOf` list is
 * empty, which the engine would read as no rule at all, so the answer is made here: 0 schedules, with
 * those courses in `emptyCourses`. `solve` runs one request without those professor rules, and when it
 * gives schedules each of those courses gets an "Allow any professor" fix (`clearAnyOf`) with its count,
 * in course order. Its schedules are never shown.
 *
 * Null, without solving, when every chosen professor has lectures. The promise never rejects: when the
 * extra solve fails or finds nothing, the answer has no fixes.
 */
export function unavailableProfessorResponse(
  request: SolveRequest,
  term: TermFile,
  solve: (request: SolveRequest) => Promise<SolveResponse>,
): Promise<SolveSuccess> | null {
  const anyOf = request.preferences?.anyOf ?? {};
  const unavailable = request.courses.filter((code) => anyOf[code]?.length === 0);
  if (unavailable.length === 0) return null;

  const withoutRules: SolveRequest = {
    ...request,
    preferences: { ...request.preferences, anyOf: Object.fromEntries(Object.entries(anyOf).filter(([code]) => !unavailable.includes(code))) },
    // Only the count is used, and total counts every schedule however many come back.
    limits: { ...request.limits, maxSchedules: 1 },
  };
  const counted = solve(withoutRules).then(
    (answer): Fix[] =>
      answer.ok && answer.total > 0
        ? unavailable.map((course) => ({ kind: "clearAnyOf", course, schedules: answer.total, capped: answer.capped }))
        : [],
    (): Fix[] => [],
  );

  return counted.then((fixes) => ({
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
      emptyCourses: unavailable.map((code) => {
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
      fixes,
    },
  }));
}
