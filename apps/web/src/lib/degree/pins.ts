import type { AuditCheck, AuditLine, AuditSection, AuditSuccess } from "@/lib/engine/types";
import type { TrackingSheet } from "./sheets";
import { getRequirements } from "./requirements";
import { crossListed as sheetCrossListed, fitsLine as sheetFitsLine, isMajorLine as sheetIsMajorLine, onlyOneRivals as sheetOnlyOneRivals } from "./rules";
import type { LinePin } from "./history";
import { areaCourses, crossListed, FREE_ELECTIVE_LINES, WPE_LINE } from "./rules";

export interface PinCourse {
  credits: number;
  taken: boolean;
}

export type PinCourses = ReadonlyMap<string, PinCourse>;

export interface PinnedAudit {
  result: AuditSuccess;
  pinned: ReadonlyMap<number, string>;
  rejected: LinePin[];
}

export interface MoveOutcome {
  best: number;
  withPin: number;
  emptied: AuditLine[];
  displaced: string | null;
  freeElectiveCourse: string | null;
}

const sameCourse = (a: string | null, b: string) => a !== null && crossListed(a).includes(b);

const flatLines = (result: AuditSuccess) => result.sections.flatMap((section) => section.lines);

export function filledLines(result: AuditSuccess): number {
  return flatLines(result).filter((line) => !FREE_ELECTIVE_LINES.includes(line.id) && (line.state === "done" || line.state === "planned" || (line.id === WPE_LINE && line.state === "partial"))).length;
}

function checksAfter(checks: readonly AuditCheck[], lines: ReadonlyMap<number, AuditLine>, courses: PinCourses, sheet: TrackingSheet): AuditCheck[] {
  const areaIds = sheet.checks.filter((check) => check.type === "area").map((check) => check.id);
  const areaSections = new Set(sheet.checks.filter((check) => check.type === "area").map((check) => check.section));
  const majorLines = sheet.sections.filter((section) => areaSections.has(section.id)).flatMap((section) => section.lines);
  return checks.map((check) => {
    if (!areaIds.includes(check.id) || check.state === "check") return check;
    const area = areaCourses(check.id, sheet);
    const onCs = majorLines.flatMap((id) => {
      const course = lines.get(id)?.course;
      return course && crossListed(course, sheet).some((code) => area.includes(code)) ? [course] : [];
    });
    if (onCs.length === 0) return { ...check, state: "not-met" as const, courses: [] };
    return { ...check, state: onCs.some((code) => courses.get(code)?.taken) ? ("met" as const) : ("planned" as const), courses: check.courses.length > 0 ? check.courses : onCs };
  });
}

export function applyPins(result: AuditSuccess, pins: readonly LinePin[], courses: PinCourses, sheet: TrackingSheet = getRequirements()): PinnedAudit {
  const FREE_ELECTIVE_LINES = sheet.sections.filter((section) => section.creditPool).flatMap((section) => section.lines);
  const areaSections = new Set(sheet.checks.filter((check) => check.type === "area").map((check) => check.section));
  const MAJOR_LINES = sheet.sections.filter((section) => areaSections.has(section.id)).flatMap((section) => section.lines);
  const WPE_LINE = sheet.lines.find((line) => line.subSlots)?.line ?? 0;
  const crossListed = (code: string) => sheetCrossListed(code, sheet);
  const fitsLine = (code: string, credits: number, line: number) => sheetFitsLine(code, credits, line, sheet);
  const isMajorLine = (line: number) => sheetIsMajorLine(line, sheet);
  const onlyOneRivals = (code: string) => sheetOnlyOneRivals(code, sheet);
  const sameCourse = (a: string | null, b: string) => a !== null && crossListed(a).includes(b);
  const rejected: LinePin[] = [];
  if (pins.length === 0) return { result, pinned: new Map(), rejected };

  const lines = new Map(flatLines(result).map((line) => [line.id, { ...line }]));
  const pool = new Set(result.freeElectives.courses);
  const extra = new Set(result.extra);
  const pinned = new Map<number, string>();
  const homeless: string[] = [];
  const size = (code: string) => courses.get(code)?.credits ?? 0;
  const stateOf = (code: string): AuditLine["state"] => (courses.get(code)?.taken ? "done" : "planned");

  function removeEverywhere(code: string): boolean {
    let found = false;
    for (const line of lines.values()) {
      if (sameCourse(line.course, code)) {
        line.course = null;
        line.state = "empty";
        found = true;
      }
    }
    for (const list of [pool, extra]) {
      for (const name of [...list]) {
        if (sameCourse(name, code)) {
          list.delete(name);
          found = true;
        }
      }
    }
    return found;
  }

  function clashesOnCs(code: string, line: number) {
    if (!isMajorLine(line)) return false;
    const rivals = onlyOneRivals(code);
    return MAJOR_LINES.some((id) => id !== line && lines.get(id)?.course && rivals.includes(lines.get(id)!.course!));
  }

  const canTake = (code: string, id: number) => fitsLine(code, size(code), id) && !clashesOnCs(code, id);
  const placeable = [...lines.keys()].filter((id) => !FREE_ELECTIVE_LINES.includes(id));

  function put(code: string, id: number) {
    const line = lines.get(id)!;
    line.course = code;
    line.state = stateOf(code);
  }

  function place(code: string, tried: Set<number>): boolean {
    const open = placeable.filter((id) => !tried.has(id) && canTake(code, id));
    const empty = open.find((id) => !lines.get(id)!.course && lines.get(id)!.state === "empty");
    if (empty !== undefined) {
      put(code, empty);
      return true;
    }
    for (const id of open) {
      tried.add(id);
      const holder = lines.get(id)!.course;
      if (!holder || pinned.has(id) || onlyOneRivals(code).includes(holder)) continue;
      if (place(holder, tried)) {
        put(code, id);
        return true;
      }
    }
    return false;
  }

  for (const pin of pins) {
    const target = lines.get(pin.line);
    const course = courses.get(pin.code);
    const isManual = target && target.course === null && target.state !== "empty";
    if (!target || !course || isManual || !fitsLine(pin.code, course.credits, pin.line) || pinned.has(pin.line)) {
      rejected.push(pin);
      continue;
    }
    const inAudit = removeEverywhere(pin.code);
    if (!inAudit) {
      rejected.push(pin);
      continue;
    }
    const holder = target.course;
    if (holder) homeless.push(holder);
    put(pin.code, pin.line);
    pinned.set(pin.line, pin.code);
  }

  const toPool: string[] = [];
  for (const code of homeless) {
    if (!place(code, new Set())) toPool.push(code);
  }
  for (const code of [...pool]) {
    if (size(code) >= 3 && place(code, new Set())) pool.delete(code);
  }
  for (const code of toPool) pool.add(code);

  const creditsTotal = result.freeElectives.creditsTotal;
  const perLine = creditsTotal / FREE_ELECTIVE_LINES.length;
  const poolPinned = [...pinned].filter(([id]) => FREE_ELECTIVE_LINES.includes(id)).map(([, code]) => code);
  const taken = [...pool].filter((code) => courses.get(code)?.taken);
  const planned = [...pool].filter((code) => !courses.get(code)?.taken);
  const fit: string[] = [];
  let credits = poolPinned.reduce((sum, code) => sum + size(code), 0);
  for (const code of [...taken, ...planned]) {
    if (credits >= creditsTotal) {
      extra.add(code);
      continue;
    }
    credits += size(code);
    fit.push(code);
  }

  let doneCredits = poolPinned.filter((code) => courses.get(code)?.taken).reduce((sum, code) => sum + size(code), 0);
  let plannedCredits = poolPinned.filter((code) => !courses.get(code)?.taken).reduce((sum, code) => sum + size(code), 0);
  for (const code of fit) {
    if (courses.get(code)?.taken) doneCredits += size(code);
    else plannedCredits += size(code);
  }
  doneCredits = Math.min(doneCredits, creditsTotal);
  plannedCredits = Math.min(plannedCredits, creditsTotal - doneCredits);

  for (const id of FREE_ELECTIVE_LINES) {
    if (pinned.has(id)) continue;
    const line = lines.get(id)!;
    line.course = null;
    line.state = "empty";
  }
  const openPoolLines = FREE_ELECTIVE_LINES.filter((id) => !pinned.has(id));
  let running = 0;
  let filled = 0;
  for (const code of fit) {
    running += size(code);
    while (filled < openPoolLines.length && running >= perLine) {
      const line = lines.get(openPoolLines[filled])!;
      line.course ??= code;
      line.state = stateOf(code);
      running -= perLine;
      filled += 1;
    }
  }

  const sections: AuditSection[] = result.sections.map((section) => {
    const next = section.lines.map((line) => lines.get(line.id)!);
    if (section.lines.some((line) => line.id === WPE_LINE)) return { ...section, lines: next };
    return { ...section, lines: next, done: next.filter((line) => line.state === "done").length, planned: next.filter((line) => line.state === "planned").length };
  });

  const adjusted: AuditSuccess = {
    ...result,
    sections,
    checks: checksAfter(result.checks, lines, courses, sheet),
    freeElectives: { ...result.freeElectives, creditsDone: doneCredits, creditsPlanned: plannedCredits, courses: [...poolPinned, ...fit] },
    extra: [...extra].sort(),
  };
  return { result: adjusted, pinned, rejected };
}

export function moveOutcome(result: AuditSuccess, pins: readonly LinePin[], courses: PinCourses, next: LinePin): MoveOutcome {
  const others = pins.filter((pin) => pin.code !== next.code && pin.line !== next.line);
  const applied = applyPins(result, [...others, next], courses).result;
  const before = new Map(flatLines(result).map((line) => [line.id, line]));
  const emptied = flatLines(applied).filter((line) => line.state === "empty" && before.get(line.id)?.state !== "empty");
  const displaced = before.get(next.line)?.course ?? null;
  const onALine = (code: string) => flatLines(applied).some((line) => sameCourse(line.course, code));
  const freeElectiveCourse = displaced && !onALine(displaced) ? displaced : (applied.freeElectives.courses.find((code) => !sameCourse(next.code, code)) ?? null);
  return { best: filledLines(result), withPin: filledLines(applied), emptied, displaced: sameCourse(displaced, next.code) ? null : displaced, freeElectiveCourse };
}
