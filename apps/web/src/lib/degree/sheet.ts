import type { AuditCheck, AuditLine, AuditSuccess } from "@/lib/engine/types";
import type { DegreeHistory, HistoryCourse } from "./history";
import { coursesInDoubt, lineState, manualItemForLine } from "./progress";
import { SECTIONS, SPORTS_ITEM } from "./requirements";
import { crossListed, WPE_LINE } from "./rules";
import { parseTerm, PRIOR_CREDIT, termShort, type TermName } from "./terms";

export type TileKind = "empty" | "done" | "planned" | "check" | "tick";

export interface SheetTile {
  key: string;
  line: number;
  /** "01", shown in the tile's corner. */
  number: string;
  label: string;
  kind: TileKind;
  course: string | null;
  /** "A26", "Prior", "Transfer", "No term" or "7a · 1/12 unit". */
  detail: string | null;
  pinned: boolean;
  /** The manual item a tick box stands for. */
  manualId: string | null;
  checked: boolean;
  /** The term a course was taken in, like "A26", so a term can light up its courses. */
  term: string | null;
}

export interface SheetSection {
  id: string;
  name: string;
  lineRange: string;
  done: number;
  planned: number;
  total: number;
  tiles: SheetTile[];
  note: string | null;
  /** "0 of 4 classes", where a section's line count says too little. */
  caption: string | null;
}

export interface SheetSummary {
  done: number;
  planned: number;
  toGo: number;
  toCheck: number;
  total: number;
}

export interface Sheet {
  sections: SheetSection[];
  summary: SheetSummary;
}

export type CheckPillState = "missing" | "review" | "met" | "planned";

export interface CheckPill {
  id: string;
  name: string;
  state: CheckPillState;
}

export type SheetFilter = "done" | "planned" | "toGo" | "toCheck";

const SECTION_NAMES: Record<string, string> = {
  hua: "Humanities & arts",
  wpe: "Wellness & PE",
  "social-science": "Social science",
  iqp: "IQP",
  "free-electives": "Free electives",
  cs: "Computer science",
  math: "Mathematics",
  science: "Science & engineering",
};

const SECTION_NOTES: Record<string, string> = {
  hua: "Finish five HUA courses before Inquiry. Check the sequence with your advisor.",
  wpe: "Four WPE classes share one numbered line.",
  cs: "MQP is included below. A course counts on one line; cross-listings do not add credit.",
  math: "Four 1000-level math courses maximum. Probability and statistics have separate lines.",
  science: "Check the required science distribution as well as the credit total.",
};

const WPE_SLOT_DETAILS = ["7a", "7b", "7c", "7d"];
export const WPE_SLOTS = WPE_SLOT_DETAILS.map((slot, index) => `wpe-${index + 1}`);

export function lineLabel(line: number): string {
  if (line <= 3) return "HUA depth";
  if (line === 4) return "HUA breadth";
  if (line === 5) return "HUA elective";
  if (line === 6) return "Inquiry / Practicum";
  if (line === 7) return "WPE";
  if (line <= 9) return "Social science";
  if (line <= 12) return "IQP";
  if (line <= 15) return "Free elective";
  if (line === 16) return "Introductory CS";
  if (line <= 21) return "CS 2000+";
  if (line === 22) return "Systems";
  if (line === 23) return "Theory & languages";
  if (line === 24) return "Design";
  if (line === 25) return "Social implications";
  if (line <= 30) return "CS 4000+";
  if (line <= 33) return "MQP";
  if (line <= 37) return "Math 1000+";
  if (line === 38) return "Math 2000+";
  if (line === 39) return "Probability";
  if (line === 40) return "Statistics";
  return "Science";
}

export const lineNumber = (line: number) => String(line).padStart(2, "0");

const sectionOfLine = (line: number) => SECTIONS.find((section) => section.lines.includes(line));

export const sectionNameOfLine = (line: number) => SECTION_NAMES[sectionOfLine(line)?.id ?? ""] ?? "";

/** "Computer Science, line 18", the way the sheet names a line. */
export const lineName = (line: number) => `${sectionNameOfLine(line)}, line ${line}`;

export function findHistoryCourse(history: DegreeHistory, code: string): HistoryCourse | undefined {
  const names = crossListed(code);
  return history.courses.find((course) => names.includes(course.code));
}

function courseDetail(course: HistoryCourse | undefined, openTerm: TermName | null): { detail: string; term: string | null } {
  const open = openTerm ? termShort(openTerm) : null;
  if (!course) return { detail: open ?? "Planned", term: open };
  const named = parseTerm(course.term);
  const term = named ? termShort(named) : course.inProgress ? open : null;
  if (course.creditSource === "transfer") return { detail: "Transfer", term };
  if (term) return { detail: term, term };
  return { detail: course.term === PRIOR_CREDIT ? "Prior" : "No term", term: null };
}

export function buildSheet(
  result: AuditSuccess,
  history: DegreeHistory,
  pinned: ReadonlyMap<number, string>,
  openTerm: TermName | null,
): Sheet {
  const doubted = coursesInDoubt(result.checks);
  const sections = SECTIONS.map((definition): SheetSection => {
    const audited = result.sections.find((section) => section.name === definition.name);
    const lines = audited?.lines ?? [];
    const first = definition.lines[0];
    const last = definition.lines[definition.lines.length - 1];
    const base = {
      id: definition.id,
      name: SECTION_NAMES[definition.id] ?? definition.name,
      lineRange: first === last ? `Line ${lineNumber(first)}` : `Lines ${lineNumber(first)}–${lineNumber(last)}`,
      note: SECTION_NOTES[definition.id] ?? null,
    };
    if (definition.id === "wpe") return { ...base, ...wpeSection(lines[0], history) };
    const tiles = lines.map((line) => tileFor(line, history, doubted, pinned, openTerm));
    return {
      ...base,
      tiles,
      total: tiles.length,
      done: tiles.filter((tile) => tile.kind === "done" || tile.kind === "check" || (tile.kind === "tick" && tile.checked)).length,
      planned: tiles.filter((tile) => tile.kind === "planned").length,
      caption: null,
    };
  });
  const done = sections.reduce((sum, section) => sum + section.done, 0);
  const planned = sections.reduce((sum, section) => sum + section.planned, 0);
  const total = sections.reduce((sum, section) => sum + section.total, 0);
  const toCheck = sections.flatMap((section) => section.tiles).filter((tile) => tile.kind === "check").length;
  return { sections, summary: { done, planned, toGo: total - done - planned, toCheck, total } };
}

function tileFor(line: AuditLine, history: DegreeHistory, doubted: ReadonlySet<string>, pinned: ReadonlyMap<number, string>, openTerm: TermName | null): SheetTile {
  const shared = { key: String(line.id), line: line.id, number: lineNumber(line.id), label: lineLabel(line.id) };
  const manual = manualItemForLine(line.id);
  if (manual) {
    return { ...shared, kind: "tick", course: null, detail: null, pinned: false, manualId: manual.id, checked: history.manual.includes(manual.id), term: null };
  }
  const state = lineState(line, doubted);
  const filled = state !== "missing";
  const historyCourse = line.course ? findHistoryCourse(history, line.course) : undefined;
  const { detail, term } = filled && line.course ? courseDetail(historyCourse, openTerm) : { detail: null, term: null };
  const typed = historyCourse?.source === "typed" && state === "done";
  const kind: TileKind = !filled ? "empty" : state === "planned" ? "planned" : state === "check" || typed ? "check" : "done";
  return { ...shared, kind, course: line.course, detail, pinned: pinned.has(line.id), manualId: null, checked: false, term };
}

/** Each WPE class has its own tick box, even though the four share one numbered line. */
function wpeSection(line: AuditLine | undefined, history: DegreeHistory) {
  const slots = line?.subSlots ?? WPE_SLOT_DETAILS.map(() => ({ course: null, state: "empty" as const }));
  const sports = history.manual.includes(SPORTS_ITEM);
  const tiles = WPE_SLOT_DETAILS.map((slot, index): SheetTile => {
    const manualId = WPE_SLOTS[index];
    const { course = null, state = "empty" } = slots[index] ?? {};
    const ticked = sports || history.manual.includes(manualId) || state === "done";
    return {
      key: `7-${slot}`,
      line: WPE_LINE,
      number: "",
      label: course ?? `WPE ${index + 1}`,
      kind: "tick",
      course,
      detail: `${slot} · 1/12 unit`,
      pinned: false,
      manualId: course ? null : manualId,
      checked: ticked || state === "planned",
      term: null,
    };
  });
  const filled = tiles.filter((tile) => tile.checked).length;
  const plannedSlots = slots.some((slot) => slot.state === "planned");
  const complete = filled === tiles.length;
  return {
    tiles,
    total: 1,
    done: complete && !plannedSlots ? 1 : 0,
    planned: complete && plannedSlots ? 1 : 0,
    caption: `${filled} of ${tiles.length} classes`,
  };
}

const AREA_PILLS: { id: string; name: string }[] = [
  { id: "systems", name: "Systems" },
  { id: "theory", name: "Theory" },
  { id: "design", name: "Design" },
  { id: "social", name: "Social implications" },
];

const pillState = (state: AuditCheck["state"]): CheckPillState => ({ met: "met", planned: "planned", check: "review", "not-met": "missing" } as const)[state];

export function checkPills(result: AuditSuccess, history: DegreeHistory): CheckPill[] {
  const state = (id: string) => pillState(result.checks.find((check) => check.id === id)?.state ?? "not-met");
  const typed = history.courses.some((course) => course.source === "typed");
  return [
    ...AREA_PILLS.map(({ id, name }) => ({ id, name, state: state(id) })),
    { id: "hua-depth", name: "HUA theme", state: state("hua-depth") },
    { id: "transfer", name: "Transfer record", state: typed ? "review" : history.courses.length > 0 ? "met" : "missing" },
  ];
}

export function tileMatchesFilter(tile: SheetTile, filter: SheetFilter): boolean {
  if (filter === "planned") return tile.kind === "planned";
  if (filter === "toCheck") return tile.kind === "check";
  const filled = tile.kind === "done" || tile.kind === "check" || (tile.kind === "tick" && tile.checked);
  return filter === "done" ? filled : tile.kind === "empty" || (tile.kind === "tick" && !tile.checked);
}

export const FILTER_WORDS: Record<SheetFilter, { chip: string; sentence: string }> = {
  done: { chip: "Done", sentence: "Showing only completed coursework" },
  planned: { chip: "Planned", sentence: "Showing only planned coursework" },
  toGo: { chip: "To go", sentence: "Showing only open lines" },
  toCheck: { chip: "To check", sentence: "Showing only lines to check" },
};
