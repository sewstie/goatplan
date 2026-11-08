import { sources, type MapSource } from "@/lib/courseMap/courseMap";
import type { CatalogCourse } from "../catalog";
import { foundCourse, hasRegistrationCode, type DegreeHistory, type HistoryCourse } from "../history";
import { huaProblem, seminarTooEarly } from "../humanities";
import { crossListed } from "../rules";
import type { TrackingSheet } from "../sheets";
import { compareTerms, nextTerm, parseTerm, sameTerm, termLong, type TermName } from "../terms";
import { backgroundCourses, preparation, ready, recordFor, type Preparation } from "./background";
import { isOffered, offering, termId, type Offering, type OfferingInput } from "./offerings";
import type { Progress, RecommendationAudit } from "./audit";
import type { ScheduleCheck } from "./schedules";

export interface Choice { course: HistoryCourse; reason: string; background: Preparation; offering: Offering; kept: boolean }
export type TermState = "open" | "reserved" | "failed" | "over";
export interface RecommendedTerm { term: TermName; state: TermState; existing: Choice[]; additions: Choice[]; alternatives: Choice[]; issues: string[]; credits: number; unused: number }
export interface RecommendationInput {
  history: DegreeHistory;
  sheet: TrackingSheet;
  catalog: readonly CatalogCourse[];
  terms: readonly TermName[];
  cap: number;
  offerings: Readonly<Record<string, OfferingInput>>;
  kept: readonly HistoryCourse[];
  excluded: readonly string[];
  confirmations: readonly string[];
  reserved: Readonly<Record<string, string>>;
  records?: readonly MapSource[];
  cancelled?: () => boolean;
}
export interface Recommendation { terms: RecommendedTerm[]; issues: string[]; limited: boolean }
const round = (value: number) => Math.round(value * 100) / 100;
const difference = (before: Progress, after: Progress) => ({ specific: Math.max(0, after.specific - before.specific), checks: Math.max(0, after.checks - before.checks), elective: Math.max(0, after.elective - before.elective) });

function equivalents(code: string, sheet: TrackingSheet): string[] {
  const record = recordFor(code);
  return [...new Set([code, ...(record ? [record.code, ...(record.aliases ?? [])] : [])].flatMap((name) => crossListed(name, sheet)))];
}

export function conflicts(code: string, courses: readonly HistoryCourse[], sheet: TrackingSheet): boolean {
  const names = equivalents(code, sheet);
  return courses.some((course) => names.includes(course.code) || sheet.onlyOneSets.some((set) => set.courses.some((item) => names.includes(item)) && set.courses.some((item) => equivalents(course.code, sheet).includes(item))));
}

export async function recommend(input: RecommendationInput, audit: RecommendationAudit, schedules?: ScheduleCheck): Promise<Recommendation> {
  if (input.sheet.id !== "cs-2030") throw new Error("Next-term suggestions are available for CS 2030 only.");
  if (!Number.isFinite(input.cap) || input.cap <= 0 || input.cap > 30 || round(input.cap) !== input.cap) throw new Error("Enter a credit cap above 0 and at most 30, with up to two decimal places.");
  if (!input.terms.length || input.terms.length > 4 || input.terms.some((term, index) => term.letter === "E" || term.year < 2026 || term.year > 2030 || (index > 0 && !sameTerm(nextTerm(input.terms[index - 1]), term)))) throw new Error("Choose one to four supported regular terms in order.");
  const records = input.records ?? sources;
  const catalog = [...new Map(input.catalog.map((course) => [course.code, course])).values()].filter((course) => course.level === "Undergraduate" && hasRegistrationCode(course.code)).sort((a, b) => a.code.localeCompare(b.code));
  const kept: HistoryCourse[] = [];
  const refused = new Map<string, string>();
  for (const course of input.kept) {
    if (!Number.isFinite(course.credits) || course.credits <= 0 || course.credits > 30 || round(course.credits) !== course.credits) throw new Error(`Review the credits for kept course ${course.code}.`);
    if (!parseTerm(course.term) || !input.terms.some((term) => sameTerm(term, parseTerm(course.term))) || input.excluded.includes(course.code)) continue;
    const hua = huaProblem(course.code, [...input.history.courses, ...kept], input.sheet);
    if (hua) { refused.set(course.code, `${hua} It wasn’t added.`); continue; }
    if (!conflicts(course.code, [...input.history.courses, ...kept], input.sheet)) kept.push(course);
  }
  let projected: DegreeHistory = { ...input.history, courses: [...input.history.courses, ...kept.map((course) => ({ ...course, status: "planned" as const }))] };
  const result: Recommendation = { terms: [], issues: [], limited: false };
  for (const course of input.kept) {
    if (kept.some((item) => item.code === course.code)) continue;
    result.issues.push(refused.get(course.code) ?? `${course.code} wasn’t added: you skipped it, already have a course like it, or it’s outside these terms. Your record is unchanged.`);
  }
  const undated = input.history.courses.filter((course) => course.status === "planned" && !parseTerm(course.term));
  if (undated.length) result.issues.push(`Plans without a term: ${undated.map((course) => course.code).join(", ")}. Give them a term in course history so later courses can build on them.`);
  for (const course of input.history.courses) if (conflicts(course.code, input.history.courses.filter((item) => item !== course), input.sheet)) result.issues.push(`${course.code} overlaps with another course in your history. Both are kept; check which one counts.`);
  const allowed = (course: CatalogCourse, term: TermName) => isOffered(offering(course, term, input.offerings[termId(term)])) && !equivalents(course.code, input.sheet).some((code) => input.excluded.includes(code)) && !conflicts(course.code, projected.courses, input.sheet) && !huaProblem(course.code, projected.courses, input.sheet) && !seminarTooEarly(course.code, projected.courses, term);
  const checkCancelled = () => { if (input.cancelled?.()) throw new Error("Your plan or settings changed. Suggest again."); };
  const makeChoice = (course: HistoryCourse, term: TermName, reason: string, isKept = false): Choice => {
    const catalogCourse = catalog.find((item) => item.code === course.code);
    return { course, kept: isKept, reason, background: preparation(course.code, projected.courses, term, input.confirmations, records), offering: catalogCourse ? offering(catalogCourse, term, input.offerings[termId(term)]) : { state: "unknown", text: "Offering not known yet.", credits: course.credits } };
  };
  let evaluations = 0;
  for (const term of input.terms) {
    checkCancelled();
    const existing = projected.courses.filter((course) => sameTerm(parseTerm(course.term), term));
    const row: RecommendedTerm = { term, state: "open", existing: existing.filter((course) => !kept.some((item) => item.code === course.code)).map((course) => makeChoice(course, term, course.status === "taken" ? "Recorded completed course." : "Existing dated plan kept in this term.", true)), additions: existing.filter((course) => kept.some((item) => item.code === course.code)).map((course) => makeChoice(course, term, "You kept this.", true)), alternatives: [], issues: [], credits: round(existing.reduce((sum, course) => sum + course.credits, 0)), unused: 0 };
    const reserved = Object.entries(input.reserved).find(([name]) => sameTerm(parseTerm(name), term))?.[1];
    if (reserved) row.state = "reserved";
    if (reserved) row.issues.push(`${reserved} reserves this term, so no courses were added.${existing.length ? " Courses already here clash with it; review them." : ""}`);
    if (row.credits > input.cap) { row.state = "over"; row.issues.push("This term is already over your limit, so nothing else was added."); }
    for (const choice of [...row.existing, ...row.additions].filter((item) => item.course.status !== "taken")) {
      if (!ready(choice.background)) row.issues.push(`${choice.course.code}: ${choice.background.text}`);
      if (!["confirmed", "estimated"].includes(choice.offering.state)) row.issues.push(`${choice.course.code}: ${choice.offering.text}`);
    }
    const blocked = input.offerings[termId(term)]?.status === "failed" || !input.offerings[termId(term)];
    if (blocked) { row.state = "failed"; row.issues.push("This term’s classes couldn’t be loaded. Suggest again to retry."); }
    const offeredHere = input.offerings[termId(term)];
    const file = schedules && offeredHere?.status === "published" ? offeredHere.file : null;
    const termCodes = () => projected.courses.filter((course) => sameTerm(parseTerm(course.term), term)).map((course) => course.code);
    const clashing: string[] = [];
    let unchecked = false;
    let unavailable = false;
    if (file && termCodes().length > 0) {
      const fit = await schedules!.fit(file, termCodes());
      checkCancelled();
      if (fit === "clashes") row.issues.push("Your courses in this term can’t all fit in one weekly schedule. Check their class times in the planner.");
      if (fit !== "fits") unavailable = true;
      if (fit === "unknown") unchecked = true;
    }
    let slots = 0;
    while (!reserved && !blocked && !unavailable && row.credits < input.cap && slots++ < 6 && evaluations < 180) {
      checkCancelled();
      const available = catalog.filter((course) => allowed(course, term));
      const termCandidates = available.map((course) => ({ ...course, credits: offering(course, term, input.offerings[termId(term)]).credits }));
      const fits = await audit.candidates(projected, termCandidates);
      checkCancelled();
      const before = await audit.progress(projected);
      const useful = available.filter((course) => (fits.get(course.code)?.length ?? 0) > 0);
      const futurePlans = projected.courses.filter((course) => course.status === "planned" && (before.allocated ?? []).some((code) => equivalents(course.code, input.sheet).includes(code)) && parseTerm(course.term) && compareTerms(parseTerm(course.term)!, term) > 0).flatMap((course) => catalog.find((item) => item.code === course.code) ?? []);
      const have = projected.courses.map((course) => course.code);
      const chains = [...useful, ...futurePlans].map((course) => ({ course, chain: backgroundCourses(course.code, records, have) }));
      const candidates = available.map((course) => {
        const value = offering(course, term, input.offerings[termId(term)]);
        const credits = value.credits;
        const background = preparation(course.code, projected.courses, term, input.confirmations, records);
        const unlocks = chains.filter((target) => target.chain.codes.some((code) => crossListed(code, input.sheet).includes(course.code)) && input.terms.some((later) => compareTerms(later, term) > 0 && ["confirmed", "estimated"].includes(offering(target.course, later, input.offerings[termId(later)]).state)));
        const unlocked = unlocks.filter((target) => input.terms.some((later) => compareTerms(later, term) > 0 && ready(preparation(target.course.code, [...projected.courses, { ...foundCourse(course), status: "planned", term: termLong(term) }], later, input.confirmations, records))));
        const names = fits.get(course.code) ?? [];
        const opportunities = input.terms.filter((later) => compareTerms(later, term) >= 0 && ["confirmed", "estimated"].includes(offering(course, later, input.offerings[termId(later)]).state)).length;
        return { course: { ...course, credits }, value, background, names, unlocks, unlocked, score: (background.state === "completed" ? 10000 : 0) + (value.state === "confirmed" ? 2000 : 0) + (names.length ? 1000 : 0) + Math.min(unlocks.length, 3) * 2000 + names.length * 10 + (5 - opportunities) * 20 - Math.floor(Number(course.code.split(" ")[1]) / 1000) * 150 };
      }).filter((candidate) => candidate.names.length || candidate.unlocks.length || (useful.length === 0 && ready(candidate.background) && before.elective < input.sheet.sections.filter((section) => section.creditPool).reduce((sum, section) => sum + (section.poolCredits ?? 0), 0)));
      candidates.sort((a, b) => b.score - a.score || a.course.code.localeCompare(b.course.code));
      const eligible = candidates.filter((item) => !/special topics/i.test(item.course.title) && ready(item.background) && ["confirmed", "estimated"].includes(item.value.state) && item.course.credits !== null && item.course.credits > 0 && round(row.credits + item.course.credits) <= input.cap);
      let selected: { choice: Choice; next: DegreeHistory; score: number } | null = null;
      let tried = 0;
      let timeChecks = 0;
      for (const candidate of eligible) {
        if (tried >= 6) break;
        if (file) {
          if (timeChecks++ >= 12) break;
          const fit = await schedules!.fit(file, [...termCodes(), candidate.course.code]);
          checkCancelled();
          if (fit === "clashes") { if (!clashing.includes(candidate.course.code)) clashing.push(candidate.course.code); continue; }
          if (fit === "unknown") { unchecked = true; continue; }
        }
        tried += 1;
        if (++evaluations > 180) break;
        const course = { ...foundCourse(candidate.course), status: "planned" as const, term: termLong(term) };
        const next = { ...projected, courses: [...projected.courses, course] };
        const gain = difference(before, await audit.progress(next));
        checkCancelled();
        const specific = gain.specific > 0 || gain.checks > 0;
        if (!specific && !candidate.unlocks.length && gain.elective <= 0) continue;
        const purpose = candidate.unlocks.length ? ` Leads to ${candidate.unlocks.slice(0, 3).map((item) => item.course.code).join(", ")} later in this plan.` : "";
        const reason = specific ? `Fills an open ${candidate.names.join(" / ") || "degree"} line on your sheet.` : candidate.unlocks.length ? `Leads to ${candidate.unlocks.slice(0, 3).map((item) => item.course.code).join(", ")}, which fill open lines later.` : "Adds free-elective credit you still need.";
        const score = candidate.score + (specific ? 12000 : 0) + Math.min(candidate.unlocked.length, 3) * 10000 + (specific || candidate.unlocks.length ? 30000 : 0);
        if (!selected || score > selected.score) selected = { choice: { course, reason: reason + (specific ? purpose : ""), background: candidate.background, offering: candidate.value, kept: false }, next, score };
      }
      if (!selected) {
        row.alternatives = candidates.slice(0, 30).map((candidate) => ({ course: { ...foundCourse(candidate.course), status: "planned", term: termLong(term) }, reason: `${candidate.names.length ? `Could fill ${candidate.names.join(" / ")}.` : candidate.unlocks.length ? `Could lead to ${candidate.unlocks[0].course.code}.` : "Could add free-elective credit."}${candidate.course.credits === null ? " Credits unknown; enter them before keeping it." : round(row.credits + candidate.course.credits) > input.cap ? " Doesn’t fit your limit." : ""}`, background: candidate.background, offering: candidate.value, kept: false }));
        break;
      }
      row.additions.push(selected.choice);
      projected = selected.next;
      row.credits = round(row.credits + selected.choice.course.credits);
    }
    const remaining = catalog.filter((course) => allowed(course, term));
    const remainingFits = await audit.candidates(projected, remaining.map((course) => ({ ...course, credits: offering(course, term, input.offerings[termId(term)]).credits })));
    checkCancelled();
    const alternatives = remaining.filter((course) => (remainingFits.get(course.code)?.length ?? 0) > 0)
      .sort((a, b) => (remainingFits.get(b.code)?.length ?? 0) - (remainingFits.get(a.code)?.length ?? 0) || a.code.localeCompare(b.code));
    const subjects = new Map<string, number>();
    const diverse = alternatives.filter((course) => { const count = subjects.get(course.subject) ?? 0; subjects.set(course.subject, count + 1); return count < 2; });
    const alternativesByCode = new Map([...diverse, ...alternatives, ...row.alternatives.map((choice) => catalog.find((course) => course.code === choice.course.code)!)].filter(Boolean).map((course) => [course.code, course]));
    const checkedAlternatives: CatalogCourse[] = [];
    if (!unavailable) for (const course of alternativesByCode.values()) {
      if (checkedAlternatives.length >= 30) break;
      if (file) {
        const fit = await schedules!.fit(file, [...termCodes(), course.code]);
        checkCancelled();
        if (fit === "unknown") unchecked = true;
        if (fit !== "fits") continue;
      }
      checkedAlternatives.push(course);
    }
    row.alternatives = checkedAlternatives.map((course) => {
      const names = remainingFits.get(course.code) ?? [];
      const choice = makeChoice({ ...foundCourse(course), status: "planned", term: termLong(term) }, term, names.length ? `Could fill ${names.join(" / ")}.` : "Might help as preparation or a free elective.");
      if (choice.offering.credits === null) choice.reason += " Credits unknown; enter them before keeping it.";
      else choice.course.credits = choice.offering.credits;
      if (round(row.credits + choice.course.credits) > input.cap) choice.reason += " Doesn’t fit your limit.";
      return choice;
    });
    const leftOut = clashing.filter((code) => !row.additions.some((choice) => choice.course.code === code));
    if (leftOut.length) row.issues.push(`Left out ${leftOut.length > 3 ? `${leftOut.slice(0, 3).join(", ")} and ${leftOut.length - 3} more` : leftOut.join(", ")}: their class times clash with your other courses this term.`);
    if (unchecked) row.issues.push("Couldn’t check class times for this term. Unchecked suggestions were left out.");
    row.unused = round(Math.max(0, input.cap - row.credits));
    if (slots > 6 || evaluations >= 180) { result.limited = true; row.issues.push("Stopped early to stay fast. Try fewer terms for a fuller plan."); }
    result.terms.push(row);
  }
  result.issues.push(...(await audit.progress(projected)).reasons);
  result.issues = [...new Set(result.issues)];
  return result;
}
