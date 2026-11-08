import type { TermFile } from "@/lib/data/types";
import type { EngineClient } from "@/lib/engine";

export type ScheduleFit = "fits" | "clashes" | "unknown";
export interface ScheduleCheck { fit(file: TermFile, codes: readonly string[]): Promise<ScheduleFit> }

export function scheduledCodes(file: TermFile, codes: readonly string[]): string[] {
  const listed = new Set(file.courses.filter((course) => course.sections.length > 0).map((course) => course.code));
  return [...new Set(codes)].filter((code) => listed.has(code)).sort();
}

export function createScheduleCheck(engine: Pick<EngineClient, "loadTerm" | "solve">): ScheduleCheck {
  const answers = new Map<string, Promise<ScheduleFit>>();
  let loaded: string | null = null;
  const unloadable = new Set<string>();
  let queue: Promise<unknown> = Promise.resolve();

  async function ask(termId: string, courses: string[]): Promise<ScheduleFit> {
    try {
      if (unloadable.has(termId)) return "unknown";
      if (loaded !== termId) {
        const response = await engine.loadTerm(termId);
        if (!response.ok) { unloadable.add(termId); return "unknown"; }
        loaded = termId;
      }
      const response = await engine.solve({ version: 1, courses, limits: { maxSchedules: 1, stepBudget: 2_000_000 } });
      if (!response.ok) return "unknown";
      return response.total > 0 ? "fits" : response.capped ? "unknown" : "clashes";
    } catch {
      loaded = null;
      return "unknown";
    }
  }

  return {
    fit(file, codes) {
      const courses = scheduledCodes(file, codes);
      if (courses.length === 0) return Promise.resolve("fits");
      const key = `${file.term.id}|${courses.join("|")}`;
      let answer = answers.get(key);
      if (!answer) {
        answer = queue.then(() => ask(file.term.id, courses));
        queue = answer;
        answers.set(key, answer);
      }
      return answer;
    },
  };
}
