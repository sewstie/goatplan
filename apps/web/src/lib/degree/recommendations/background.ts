import { sources, type Background, type MapSource } from "@/lib/courseMap/courseMap";
import type { HistoryCourse } from "../history";
import { compareTerms, parseTerm, type TermName } from "../terms";

export type BackgroundState = "completed" | "conditional" | "confirmed" | "skills" | "missing" | "unknown";
export interface Preparation { state: BackgroundState; text: string; notes: string[] }
export const ready = (value: Preparation) => ["completed", "conditional", "confirmed"].includes(value.state);

export function recordFor(code: string, records: readonly MapSource[] = sources) {
  return records.find((record) => record.code === code || record.aliases?.includes(code));
}

export function preparation(code: string, history: readonly HistoryCourse[], term: TermName, confirmations: readonly string[] = [], records: readonly MapSource[] = sources): Preparation {
  const record = recordFor(code, records);
  if (!record) return { state: "unknown", text: "WPI background isn’t tracked here for this course. Check the catalog.", notes: [] };
  if (!record.background) return { state: "completed", text: "No background listed.", notes: [] };
  function evaluate(expression: Background): Preparation {
    if ("course" in expression) {
      const reference = recordFor(expression.course, records);
      const names = [expression.course, ...(reference ? [reference.code, ...(reference.aliases ?? [])] : [])];
      const evidence = history.filter((course) => names.includes(course.code));
      if (evidence.some((course) => course.status === "taken")) return { state: "completed", text: `Builds on ${expression.course}, which you have completed.`, notes: [] };
      if (evidence.some((course) => { const date = parseTerm(course.term); return date && compareTerms(date, term) < 0; })) return { state: "conditional", text: `Assumes completion of ${expression.course} planned in an earlier term.`, notes: [] };
      const suffix = evidence.length ? evidence.some((course) => !parseTerm(course.term)) ? " Its undated plan needs a term." : " Its plan is in this term or later." : "";
      return { state: "missing", text: `Missing recommended background: ${expression.course}.${suffix}`, notes: [] };
    }
    if ("note" in expression) return { state: confirmations.includes(expression.note) ? "confirmed" : "skills", text: `${confirmations.includes(expression.note) ? "You confirmed" : "Confirm experience before relying on"}: ${expression.note}.`, notes: [expression.note] };
    const children = ("all" in expression ? expression.all : expression.any).map(evaluate);
    if ("any" in expression) return children.find((child) => child.state === "completed") ?? children.find(ready) ?? { state: children.some((child) => child.state === "skills") ? "skills" : "missing", text: `One of: ${children.map((child) => child.text).join(" ")}`, notes: children.flatMap((child) => child.notes) };
    const state = children.find((child) => !ready(child))?.state ?? (children.some((child) => child.state === "conditional") ? "conditional" : children.some((child) => child.state === "confirmed") ? "confirmed" : "completed");
    return { state, text: children.map((child) => child.text).join(" "), notes: children.flatMap((child) => child.notes) };
  }
  return evaluate(record.background);
}

export function backgroundCourses(code: string, records: readonly MapSource[] = sources, have: readonly string[] = [], seen = new Set<string>(), budget = { left: 96 }): { codes: string[]; uncertain: boolean } {
  if (seen.has(code) || --budget.left < 0) return { codes: [], uncertain: true };
  const record = recordFor(code, records);
  if (!record) return { codes: [], uncertain: true };
  const covered = (name: string) => { const known = recordFor(name, records); return [name, ...(known ? [known.code, ...(known.aliases ?? [])] : [])].some((item) => have.includes(item)); };
  function walk(expression: Background | null): { codes: string[]; uncertain: boolean } {
    if (!expression || "note" in expression) return { codes: [], uncertain: false };
    if ("course" in expression) {
      if (covered(expression.course)) return { codes: [], uncertain: false };
      const nested = backgroundCourses(expression.course, records, have, new Set([...seen, code]), budget);
      return { codes: [expression.course, ...nested.codes], uncertain: nested.uncertain };
    }
    if ("any" in expression && expression.any.some((option) => "course" in option && covered(option.course))) return { codes: [], uncertain: false };
    const results = ("all" in expression ? expression.all : expression.any).map(walk);
    return { codes: [...new Set(results.flatMap((result) => result.codes))], uncertain: results.some((result) => result.uncertain) };
  }
  return walk(record.background);
}
