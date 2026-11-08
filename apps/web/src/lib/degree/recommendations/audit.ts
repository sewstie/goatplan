import type { AuditSuccess } from "@/lib/engine";
import type { AuditEngine } from "../degreeSource";
import { buildAuditRequest, type DegreeHistory } from "../history";
import { applyPins } from "../pins";
import { crossListed } from "../rules";
import type { TrackingSheet } from "../sheets";
import type { CatalogCourse } from "../catalog";

export interface Progress { specific: number; checks: number; elective: number; allocated?: string[]; reasons: string[] }
export interface RecommendationAudit {
  candidates(history: DegreeHistory, courses: readonly CatalogCourse[]): Promise<Map<string, string[]>>;
  progress(history: DegreeHistory): Promise<Progress>;
}

export function createRecommendationAudit(engine: AuditEngine, sheet: TrackingSheet): RecommendationAudit {
  const cache = new Map<string, Promise<AuditSuccess>>();
  async function ask(history: DegreeHistory, courses: readonly CatalogCourse[] = []) {
    const request = { ...buildAuditRequest(history, sheet), candidates: courses.map((course) => ({ code: course.code, credits: course.credits ?? 3 })) };
    const key = JSON.stringify(request);
    let pending = cache.get(key);
    if (!pending) {
      pending = engine.audit(request).then((response) => { if (!response.ok) throw new Error("The degree audit couldn’t be checked. Try again."); return response; });
      cache.set(key, pending);
    }
    const result = await pending;
    const pins = new Map(history.courses.flatMap((course) => crossListed(course.code, sheet).map((code) => [code, { credits: course.credits, taken: course.status === "taken" }] as const)));
    return applyPins(result, history.pins ?? [], pins, sheet).result;
  }
  return {
    async candidates(history, courses) {
      const result = await ask(history, courses);
      const names = new Map(result.sections.flatMap((section) => section.lines.map((line) => [line.id, section.name] as const)));
      const checks = new Map(result.checks.map((check) => [check.id, check.label]));
      return new Map(result.candidateResults.map((candidate) => [candidate.code, [...new Set([...candidate.closesLines.map((line) => names.get(line) ?? `Line ${line}`), ...candidate.closesChecks.map((check) => checks.get(check) ?? check)])]]));
    },
    async progress(history) {
      const result = await ask(history);
      const pools = new Set(sheet.sections.filter((section) => section.creditPool).flatMap((section) => section.lines));
      return {
        specific: result.sections.flatMap((section) => section.lines).filter((line) => !pools.has(line.id) && (line.state === "done" || line.state === "planned")).length,
        checks: result.checks.filter((check) => check.state === "met" || check.state === "planned").length,
        allocated: result.sections.flatMap((section) => section.lines).flatMap((line) => line.course && !pools.has(line.id) ? [line.course] : []),
        elective: result.freeElectives.creditsDone + result.freeElectives.creditsPlanned,
        reasons: [...sheet.lines.filter((line) => line.filter.type === "manual" && result.sections.flatMap((section) => section.lines).some((item) => item.id === line.line && item.state === "empty")).map((line) => `Your ${line.name} isn’t on the sheet yet. Suggestions don’t add project credit.`), ...result.checks.filter((check) => check.state === "not-met" || check.state === "check").map((check) => `${check.label} still needs attention.`)],
      };
    },
  };
}
