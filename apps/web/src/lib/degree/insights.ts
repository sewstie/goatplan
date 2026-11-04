import type { AuditCheck, AuditCourse } from "@/lib/engine/types";
import type { DegreeHistory, HistoryCourse } from "./history";
import { lineNumber, lineName, sectionNameOfLine, type Sheet, type SheetSection } from "./sheet";
import { areaCourses, crossListed, fitsLine, onlyOneRivals } from "./rules";
import { unitLabel } from "./units";
import { compareTerms, nextTerm, parseTerm, termLong, termShort, termsBetween, type TermName } from "./terms";

export interface TermBar {
  key: string | null;
  label: string;
  axis: string;
  year: number | null;
  done: number;
  planned: number;
}

export interface CreditsPerTerm {
  bars: TermBar[];
  noTerm: TermBar;
  average: number | null;
  datedDone: number;
  undated: number;
}

function withoutRepeats(courses: readonly HistoryCourse[]): HistoryCourse[] {
  const seen = new Set<string>();
  return courses.filter((course) => {
    if (seen.has(course.code)) return false;
    for (const code of crossListed(course.code)) seen.add(code);
    return true;
  });
}

export function creditsPerTerm(history: DegreeHistory, plan: readonly AuditCourse[], openTerm: TermName | null): CreditsPerTerm {
  const courses = withoutRepeats(history.courses);
  const known = new Set(courses.flatMap((course) => crossListed(course.code)));
  const buckets = new Map<string, { term: TermName; done: number; planned: number }>();
  const bucket = (term: TermName) => {
    const key = termShort(term);
    const found = buckets.get(key) ?? { term, done: 0, planned: 0 };
    buckets.set(key, found);
    return found;
  };
  const noTerm: TermBar = { key: null, label: "No term", axis: "No term", year: null, done: 0, planned: 0 };
  let datedDone = 0;
  let undated = 0;
  for (const course of courses) {
    const term = parseTerm(course.term) ?? (course.inProgress ? openTerm : null);
    if (course.inProgress) {
      if (term) bucket(term).planned += course.credits;
      else noTerm.planned += course.credits;
    } else if (term) {
      bucket(term).done += course.credits;
      datedDone += 1;
    } else {
      noTerm.done += course.credits;
      undated += 1;
    }
  }
  if (openTerm) {
    for (const course of plan) {
      if (!known.has(course.code)) bucket(openTerm).planned += course.credits;
    }
  }
  const dated = [...buckets.values()].map((item) => item.term).sort(compareTerms);
  const newest = openTerm ? nextTerm(openTerm) : dated.at(-1);
  const oldest = dated[0] ?? openTerm;
  const range = oldest && newest ? termsBetween(oldest, compareTerms(newest, dated.at(-1) ?? newest) >= 0 ? newest : dated.at(-1)!) : [];
  const bars = range.map((term): TermBar => {
    const found = buckets.get(termShort(term));
    return { key: termShort(term), label: termLong(term), axis: `${term.letter} Term`, year: term.year, done: found?.done ?? 0, planned: found?.planned ?? 0 };
  });
  const finished = bars.filter((bar) => bar.done > 0);
  const average = datedDone >= 2 && finished.length > 0 ? finished.reduce((sum, bar) => sum + bar.done, 0) / finished.length : null;
  return { bars, noTerm, average, datedDone, undated };
}

export const hasEnoughDates = (credits: CreditsPerTerm) => credits.datedDone >= 2;

export interface PlanningItem {
  title: string;
  text: string;
  aside: string | null;
}

export function planningFirst(sheet: Sheet, checks: readonly AuditCheck[]): PlanningItem[] {
  const tiles = sheet.sections.flatMap((section) => section.tiles);
  const items: PlanningItem[] = [];
  const inquiry = tiles.find((tile) => tile.line === 6);
  if (inquiry?.kind === "empty") items.push({ title: "Inquiry seminar", text: "After five humanities courses.", aside: `Line ${lineNumber(6)}` });
  const projects = tiles.filter((tile) => tile.kind === "tick" && tile.line !== 7 && !tile.checked).length;
  if (projects > 0) items.push({ title: "IQP & MQP", text: "Make room for the projects.", aside: `${projects} ${projects === 1 ? "line" : "lines"}` });
  const open = [["systems", "Systems"], ["theory", "Theory"], ["design", "Design"], ["social", "Social implications"]].filter(([id]) => checks.find((check) => check.id === id)?.state === "not-met");
  if (open.length > 0) items.push({ title: "CS area checks", text: `${open.map(([, name]) => name).join(", ")}.`, aside: `${open.length} ${open.length === 1 ? "check" : "checks"}` });
  items.push({ title: "Remaining coursework", text: "Group the flexible lines after these.", aside: null });
  return items;
}

const CHECK_WORDS: Record<string, string> = {
  systems: "Systems",
  theory: "Theory",
  design: "Design",
  social: "Social implications",
  "science-depth": "Science depth",
  "hua-depth": "HUA theme",
  "hua-breadth": "HUA breadth",
};

const lineWord = (line: number) => {
  const name = sectionNameOfLine(line);
  return { "Computer science": "CS", Mathematics: "math", "Science & engineering": "science", "Humanities & arts": "humanities", "Social science": "social science" }[name] ?? name.toLowerCase();
};

export function closesSentence({ lines, checks }: { lines: readonly number[]; checks: readonly string[] }): string {
  const named = checks.map((id) => CHECK_WORDS[id]).filter(Boolean);
  const counts = new Map<string, number>();
  for (const line of lines) counts.set(lineWord(line), (counts.get(lineWord(line)) ?? 0) + 1);
  const lineParts = [...counts].map(([word, count]) => `${count} ${word} ${count === 1 ? "line" : "lines"}`);
  return [...named, ...lineParts].join(" + ");
}

export interface Suggestion {
  code: string;
  text: string;
}

const AREA_FIRST = new Set(["systems", "theory", "design", "social"]);

type Closes = { lines: number[]; checks: string[] };

function byUsefulness([codeA, a]: [string, Closes], [codeB, b]: [string, Closes]) {
  const areas = (closes: Closes) => closes.checks.filter((id) => AREA_FIRST.has(id)).length;
  const isCs = (code: string) => (code.startsWith("CS ") ? 1 : 0);
  return areas(b) - areas(a) || b.checks.length - a.checks.length || isCs(codeB) - isCs(codeA) || b.lines.length - a.lines.length || codeA.localeCompare(codeB);
}

function oncePerCourse(list: [string, Closes][]): [string, Closes][] {
  const seen = new Set<string>();
  return list.filter(([code]) => {
    if (seen.has(code)) return false;
    for (const name of crossListed(code)) seen.add(name);
    return true;
  });
}

export function suggestions(details: ReadonlyMap<string, Closes> | null | undefined, limit = 2): Suggestion[] {
  if (!details) return [];
  return oncePerCourse([...details].sort(byUsefulness))
    .slice(0, limit)
    .map(([code, closes]) => ({ code, text: closesSentence(closes) }));
}

export interface LineFit {
  code: string;
  text: string;
}

export function offeredForLine(line: number, details: ReadonlyMap<string, { lines: number[]; checks: string[] }> | null | undefined, sizes: ReadonlyMap<string, number>, limit = 3): LineFit[] {
  if (!details) return [];
  const word = lineWord(line);
  return oncePerCourse([...details].filter(([code]) => fitsLine(code, sizes.get(code) ?? 3, line)).sort(byUsefulness))
    .slice(0, limit)
    .map(([code, closes]) => ({ code, text: [...closes.checks.map((id) => CHECK_WORDS[id]).filter(Boolean), `this ${word} line`].join(" + ") }));
}

export interface HistoryFit {
  code: string;
  codes: string;
  text: string;
  here: boolean;
}

export function whereNow(code: string, sections: readonly SheetSection[], freeElectives: readonly string[]): string {
  const names = crossListed(code);
  const tile = sections.flatMap((section) => section.tiles).find((item) => item.course !== null && names.includes(item.course));
  if (tile) return `Currently ${tile.pinned ? "pinned to" : "on"} ${lineName(tile.line)}`;
  return freeElectives.some((name) => names.includes(name)) ? "Counted in free electives" : "Not on a line";
}

export const codesOf = (code: string) => crossListed(code).join(" / ");

export function historyForLine(line: number, history: DegreeHistory, sections: readonly SheetSection[], freeElectives: readonly string[]): HistoryFit[] {
  return withoutRepeats(history.courses)
    .filter((course) => fitsLine(course.code, course.credits, line))
    .map((course) => ({ code: course.code, codes: codesOf(course.code), text: whereNow(course.code, sections, freeElectives), here: false }))
    .filter((fit) => !fit.text.endsWith(`line ${line}`));
}

const AREA_LINES: Record<number, string> = { 22: "systems", 23: "theory", 24: "design", 25: "social" };

export interface MoveTarget {
  line: number;
  title: string;
  text: string;
  current: boolean;
}

export function moveTargets(code: string, credits: number, sheet: Sheet): MoveTarget[] {
  const names = crossListed(code);
  const belongsTo = (line: number) => (AREA_LINES[line] ? areaCourses(AREA_LINES[line]).some((name) => names.includes(name)) : line !== 16 || names.some((name) => name === "CS 1101" || name === "CS 1102"));
  const tiles = sheet.sections.flatMap((section) => section.tiles).filter((tile) => {
    if (tile.kind === "tick" || !fitsLine(code, credits, tile.line)) return false;
    return (tile.course !== null && names.includes(tile.course)) || belongsTo(tile.line);
  });
  const current = tiles.find((tile) => tile.course !== null && names.includes(tile.course));
  const targets: MoveTarget[] = [];
  const add = (line: number, holder: string | null, isCurrent: boolean, label: string) => {
    targets.push({ line, title: `${sectionNameOfLine(line)} · ${line}`, text: `${label} · ${isCurrent ? "currently here" : holder ? `holds ${holder}` : "empty"}`, current: isCurrent });
  };
  if (current) add(current.line, null, true, current.label);
  const groups = new Set<string>();
  for (const tile of tiles) {
    if (tile === current || groups.has(tile.label)) continue;
    const firstEmpty = tiles.find((item) => item.label === tile.label && item.course === null);
    const chosen = firstEmpty ?? tile;
    if (chosen === current) continue;
    groups.add(tile.label);
    add(chosen.line, chosen.course, false, chosen.label);
  }
  return targets.sort((a, b) => a.line - b.line).sort((a, b) => Number(sectionNameOfLine(a.line) === "Free electives") - Number(sectionNameOfLine(b.line) === "Free electives"));
}

export function unavailableExample(code: string, credits: number): number | null {
  return [40, 39, 6, 41, 34, 17].find((line) => !fitsLine(code, credits, line)) ?? null;
}

export interface NotOnALine {
  code: string;
  text: string;
}

export function notOnALine(extra: readonly string[], history: DegreeHistory, sheet: Sheet): NotOnALine[] {
  const tiles = sheet.sections.flatMap((section) => section.tiles);
  return extra.map((code) => {
    const partner = tiles.find((tile) => tile.course !== null && crossListed(code).includes(tile.course));
    if (partner) return { code, text: `Duplicate record · already counted on line ${partner.line}` };
    const course = history.courses.find((item) => item.code === code);
    return { code, text: course?.credits === 0 ? "No credit · doesn't fill a line" : "Extra · no unmet requirement left to fill" };
  });
}

export type CheckStatus = "met" | "planned" | "missing" | "check" | "later";

export interface CheckRowText {
  id: string;
  name: string;
  status: CheckStatus;
  text: string;
}

const STATUS: Record<AuditCheck["state"], CheckStatus> = { met: "met", planned: "planned", "not-met": "missing", check: "check" };

function areaText(check: AuditCheck | undefined, noneText: string): string {
  if (!check || check.state === "not-met" || check.courses.length === 0) return noneText;
  return `${check.courses.join(", ")} ${check.courses.length === 1 ? "is" : "are"} ${check.state === "planned" ? "planned" : "counted"}.`;
}

function joined(codes: readonly string[]): string {
  return codes.length < 2 ? (codes[0] ?? "") : `${codes.slice(0, -1).join(", ")} and ${codes.at(-1)}`;
}

export function checkRows(checks: readonly AuditCheck[], history: DegreeHistory): CheckRowText[] {
  const find = (id: string) => checks.find((check) => check.id === id);
  const statusOf = (id: string): CheckStatus => STATUS[find(id)?.state ?? "not-met"];
  const taken = new Set(history.courses.filter((course) => !course.inProgress).map((course) => course.code));
  const typed = history.courses.some((course) => course.source === "typed");
  const science = find("science-depth");
  const scienceDone = science?.courses.filter((code) => taken.has(code)) ?? [];
  const sciencePlanned = science?.courses.filter((code) => !taken.has(code)) ?? [];
  const scienceText = science && science.courses.length > 0
    ? [scienceDone.length > 0 && `${joined(scienceDone)} ${scienceDone.length === 1 ? "is" : "are"} done`, sciencePlanned.length > 0 && `${joined(sciencePlanned)} ${sciencePlanned.length === 1 ? "is" : "are"} planned`].filter(Boolean).join("; ") + "."
    : "You need 2 courses in one of BB, CH, GE or PH.";
  const apIb = find("hua-ap-ib-limit");
  const hasApIb = history.courses.some((course) => course.apIb);
  const graduate = find("grad-equivalence");
  const rows: CheckRowText[] = [
    { id: "systems", name: "Systems", status: statusOf("systems"), text: areaText(find("systems"), "No completed or planned Systems course is counted.") },
    { id: "theory", name: "Theory & languages", status: statusOf("theory"), text: areaText(find("theory"), "No matching course is counted.") },
    { id: "design", name: "Design", status: statusOf("design"), text: areaText(find("design"), "No matching course is counted.") },
    {
      id: "social",
      name: "Social implications",
      status: statusOf("social"),
      text: find("social")?.state === "check" ? "A course outside CS meets this, but it doesn’t count toward your CS units." : areaText(find("social"), "CS 3043 could fill this check and a CS line."),
    },
    {
      id: "hua-depth",
      name: "HUA theme",
      status: statusOf("hua-depth"),
      text: find("hua-depth")?.state === "not-met" ? "You need 3 related courses in one grouping." : find("hua-depth")?.state === "check" ? "Confirm the relationship between the humanities courses with your advisor." : "You confirmed these courses are related.",
    },
    {
      id: "hua-breadth",
      name: "HUA breadth",
      status: statusOf("hua-breadth"),
      text: find("hua-breadth")?.state === "check" ? "You need a course outside your depth grouping. Ask your advisor if all your courses are in languages." : find("hua-breadth")?.state === "not-met" ? "You need a course outside your depth grouping." : "A course outside your depth grouping is counted.",
    },
    {
      id: "transfer",
      name: "Transfer record",
      status: typed ? "check" : history.courses.length > 0 ? "met" : "missing",
      text: typed ? "Review the department’s approval for the manual transfer record." : "No manual transfer records to review.",
    },
    { id: "science-depth", name: "Science distribution", status: statusOf("science-depth"), text: scienceText },
    {
      id: "ap-ib",
      name: "AP / IB limits",
      status: apIb?.state === "check" ? "check" : hasApIb ? "met" : "later",
      text: apIb?.state === "check" ? "Only 1 AP/IB course can count toward humanities." : "Keep the award status with the history record. Review applicable limits before marking a requirement done.",
    },
    { id: "residency", name: "WPI residency", status: statusOf("residency"), text: "You need 8 units at WPI. A course code can’t show where you took it." },
  ];
  if (graduate && graduate.courses.length > 0) {
    rows.push({ id: "grad-equivalence", name: "Graduate courses", status: "check", text: "Each graduate course counts here as one 4000+ course. The sheet’s 2-for-3 rule may give you more." });
  }
  return rows;
}

export interface AllocationRow {
  kind: "counted" | "kept" | "skipped" | "small" | "elective" | "extra";
  title: string;
  text: string;
  badge: string;
}

export function allocationReview(history: DegreeHistory, plan: readonly AuditCourse[], sheet: Sheet, result: { freeElectives: { courses: string[] }; extra: string[] }): AllocationRow[] {
  const rows: AllocationRow[] = [];
  const tiles = sheet.sections.flatMap((section) => section.tiles);
  const repeatsDone = new Set<string>();
  for (const course of history.courses) {
    const names = crossListed(course.code);
    if (names.length < 2 || repeatsDone.has(names[0])) continue;
    repeatsDone.add(names[0]);
    const tile = tiles.find((item) => item.course !== null && names.includes(item.course));
    rows.push({ kind: "counted", title: names.join(" / "), text: `${tile ? `Allocated to ${sectionNameOfLine(tile.line)}.` : "Kept in history."} The cross-listed entry shares the same credit.`, badge: "Counted once" });
  }
  const taken = new Set(history.courses.filter((course) => !course.inProgress).map((course) => course.code));
  for (const course of [...history.courses.filter((item) => item.inProgress), ...plan]) {
    const rival = onlyOneRivals(course.code).find((code) => taken.has(code));
    if (rival) rows.push({ kind: "kept", title: `${rival} completed + ${course.code} planned`, text: "The completed alternative takes priority. The planned alternative adds no credit to this requirement.", badge: "Taken course kept" });
  }
  const crossExtras = result.extra.filter((code) => crossListed(code).length > 1 && tiles.some((tile) => tile.course !== null && crossListed(code).includes(tile.course)));
  for (const code of crossExtras) rows.push({ kind: "skipped", title: `${code} entered twice`, text: "The repeated record adds no second credit.", badge: "Duplicate skipped" });
  for (const course of history.courses) {
    if (course.credits >= 0.75 && course.credits < 3) {
      rows.push({ kind: "small", title: `${course.title || course.code} · ${unitLabel(course.credits)}`, text: "Uses the credit amount you entered, rather than assuming a full course.", badge: `${unitLabel(course.credits)} counted` });
    }
  }
  for (const code of result.freeElectives.courses) {
    if ((history.courses.find((course) => course.code === code)?.credits ?? 3) >= 3) rows.push({ kind: "elective", title: code, text: "Assigned after specific requirements, while free-elective credit remains.", badge: "Free elective" });
  }
  for (const code of result.extra) {
    if (!crossExtras.includes(code)) rows.push({ kind: "extra", title: code, text: "Kept in history; no unmet requirement filled.", badge: "Extra" });
  }
  return rows;
}

export function badgesFor(code: string, gaps: { closes: ReadonlyMap<string, string[]> | null; details?: ReadonlyMap<string, { lines: number[]; checks: string[] }> | null } | null): string[] | undefined {
  const names = gaps?.closes?.get(code);
  if (!names) return undefined;
  const checks = gaps?.details?.get(code)?.checks.map((id) => CHECK_WORDS[id]).filter(Boolean) ?? [];
  return checks.length > 0 ? checks : names;
}
