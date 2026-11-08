import type { DegreeHistory, LinePin } from "./history";
import { fitsLine, crossListed } from "./rules";
import { getRequirements } from "./requirements";
import type { TrackingSheet } from "./sheets";

export interface ImportedPin extends LinePin {
  allowed: boolean;
}

export interface ImportPreview {
  incoming: DegreeHistory;
  fileName: string;
  newCourses: number;
  alreadyHere: number;
  pins: ImportedPin[];
  existing: number;
}

export function previewImport(incoming: DegreeHistory, fileName: string, current: DegreeHistory, sheet: TrackingSheet = getRequirements()): ImportPreview {
  const here = new Set(current.courses.map((course) => course.code));
  const sizes = new Map([...current.courses, ...incoming.courses].map((course) => [course.code, course.credits]));
  const known = (code: string) => crossListed(code, sheet).some((name) => sizes.has(name));
  const size = (code: string) => crossListed(code, sheet).map((name) => sizes.get(name)).find((credits) => credits !== undefined) ?? 0;
  return {
    incoming,
    fileName,
    newCourses: incoming.courses.filter((course) => !here.has(course.code)).length,
    alreadyHere: incoming.courses.filter((course) => here.has(course.code)).length,
    pins: (incoming.pins ?? []).map((pin) => ({ ...pin, allowed: known(pin.code) && fitsLine(pin.code, size(pin.code), pin.line, sheet) })),
    existing: current.courses.length,
  };
}
