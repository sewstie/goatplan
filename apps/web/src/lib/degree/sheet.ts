import type { AuditCheck, AuditLine, AuditSuccess } from "@/lib/engine/types";
import type { DegreeHistory, HistoryCourse } from "./history";
import { coursesInDoubt, lineState, manualItemForLine } from "./progress";
import { loadedRequirements, SECTIONS, SPORTS_ITEM } from "./requirements";
import { crossListed, WPE_LINE } from "./rules";
import { parseTerm, PRIOR_CREDIT, termLong, termShort, type TermName } from "./terms";

export type TileKind = "empty" | "done" | "planned" | "check" | "tick";

export interface SheetTile {
  key: string;
  line: number;
  number: string;
  label: string;
  kind: TileKind;
  course: string | null;
  detail: string | null;
  pinned: boolean;
  manualId: string | null;
  checked: boolean;
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
  cs: "A course counts on one line; cross-listings do not add credit.",
  math: "Four 1000-level math courses maximum. Probability and statistics have separate lines.",
  science: "Check the required science distribution as well as the credit total.",
};

const WPE_SLOT_DETAILS = ["7a", "7b", "7c", "7d"];
export const WPE_SLOTS = WPE_SLOT_DETAILS.map((slot, index) => `wpe-${index + 1}`);

export function lineLabel(line: number): string {
  const definition = loadedRequirements()?.lines.find((item) => item.line === line);
  return definition?.displayName ?? definition?.name ?? "";
}

export const lineNumber = (line: number) => String(line).padStart(2, "0");

const sectionOfLine = (line: number) => SECTIONS.find((section) => section.lines.includes(line));

export const sectionNameOfLine = (line: number) => {
  const section = sectionOfLine(line);
  return section?.displayName ?? SECTION_NAMES[section?.id ?? ""] ?? section?.name ?? "";
};

export const lineName = (line: number) => `${sectionNameOfLine(line)}, line ${line}`;

export function findHistoryCourse(history: DegreeHistory, code: string): HistoryCourse | undefined {
  const names = crossListed(code);
  return history.courses.find((course) => names.includes(course.code));
}

function courseDetail(course: HistoryCourse | undefined, openTerm: TermName | null): { detail: string | null; term: string | null } {
  const open = openTerm ? termShort(openTerm) : null;
  if (!course) return { detail: openTerm ? termLong(openTerm) : "Planned", term: open };
  const named = parseTerm(course.term) ?? (course.inProgress ? openTerm : null);
  const term = named ? termShort(named) : null;
  if (course.creditSource === "transfer") return { detail: "Transfer", term };
  if (named) return { detail: termLong(named), term };
  return { detail: course.term === PRIOR_CREDIT ? "Prior" : null, term: null };
}

export function buildSheet(
  result: AuditSuccess,
  history: DegreeHistory,
  pinned: ReadonlyMap<number, string>,
  openTerm: TermName | null,
): Sheet {
  const doubted = coursesInDoubt(result.checks);
  for (const check of result.checks) {
    const rule = loadedRequirements()?.checks.find((item) => item.id === check.id);
    if (check.state !== "check" || !rule?.affectsLines) continue;
    for (const line of result.sections.flatMap((section) => section.lines)) {
      if (line.course && rule.lines?.includes(line.id)) doubted.add(line.course);
    }
  }
  const sections = SECTIONS.map((definition): SheetSection => {
    const audited = result.sections.find((section) => section.name === definition.name);
    const lines = audited?.lines ?? [];
    const first = definition.lines[0];
    const last = definition.lines[definition.lines.length - 1];
    const base = {
      id: definition.id,
      name: definition.displayName ?? SECTION_NAMES[definition.id] ?? definition.name,
      lineRange: first === last ? `Line ${lineNumber(first)}` : `Lines ${lineNumber(first)}–${lineNumber(last)}`,
      note: definition.note ?? SECTION_NOTES[definition.id] ?? null,
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
  if (manual && !line.course) {
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

const MQP_LINES = new Set([31, 32, 33]);

export function sectionsWithMqp(sections: readonly SheetSection[]): SheetSection[] {
  return sections.flatMap((section) => {
    if (section.id !== "cs") return [section];
    const mqp = section.tiles.filter((tile) => MQP_LINES.has(tile.line));
    const count = (tiles: readonly SheetTile[], kinds: (tile: SheetTile) => boolean) => tiles.filter(kinds).length;
    const finished = (tile: SheetTile) => tile.kind === "done" || tile.kind === "check" || (tile.kind === "tick" && tile.checked);
    const rest = section.tiles.filter((tile) => !MQP_LINES.has(tile.line));
    return [
      { ...section, tiles: rest, total: rest.length, done: count(rest, finished), planned: count(rest, (tile) => tile.kind === "planned"), lineRange: `Lines ${lineNumber(rest[0]?.line ?? 16)}–${lineNumber(rest.at(-1)?.line ?? 30)}` },
      { ...section, id: "mqp", name: "MQP", tiles: mqp, total: mqp.length, done: count(mqp, finished), planned: count(mqp, (tile) => tile.kind === "planned"), lineRange: "Lines 31–33", note: null },
    ];
  });
}

export function sectionFinished(section: SheetSection): boolean {
  return section.total > 0 && section.tiles.every((tile) => tile.kind === "done" || (tile.kind === "tick" && tile.checked));
}

export interface TileStack {
  key: string;
  label: string;
  tiles: SheetTile[];
}

export function stackEmptyTiles(tiles: readonly SheetTile[]): (SheetTile | TileStack)[] {
  const result: (SheetTile | TileStack)[] = [];
  let run: SheetTile[] = [];
  const flush = () => {
    if (run.length === 1) result.push(run[0]);
    else if (run.length > 1) result.push({ key: `stack-${run[0].key}`, label: run[0].label, tiles: run });
    run = [];
  };
  for (const tile of tiles) {
    if (tile.kind === "empty" && (run.length === 0 || run[0].label === tile.label)) {
      run.push(tile);
      continue;
    }
    flush();
    if (tile.kind === "empty") run.push(tile);
    else result.push(tile);
  }
  flush();
  return result;
}

export const isTileStack = (item: SheetTile | TileStack): item is TileStack => "tiles" in item;

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
    ...result.checks.filter((check) => loadedRequirements()?.checks.some((item) => item.id === check.id && item.type === "area")).map((check) => ({ id: check.id, name: AREA_PILLS.find((pill) => pill.id === check.id)?.name ?? check.label.replace(/ area$/, ""), state: state(check.id) })),
    ...(result.checks.some((check) => check.id === "hua-depth") ? [{ id: "hua-depth", name: "HUA theme", state: state("hua-depth") }] : []),
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
