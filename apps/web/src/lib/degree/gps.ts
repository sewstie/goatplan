import data from "./gps-sections.json";
import type { DegreeHistory, HistoryCourse } from "./history";
import { HUA_SUBJECTS } from "./humanities";

export interface GpsSection {
  id: string;
  name: string;
  credits: { code: string; credits: number }[];
}

export interface GpsPick {
  sectionId: string;
  status: "taken" | "planned";
  term?: string;
}

export interface GpsCreditPlan {
  add: HistoryCourse[];
  skipped: string[];
  replace: string[];
}

export const GPS_SECTIONS = data.sections as GpsSection[];
export const GPS_COURSES: readonly string[] = data.courses;

export const isGpsCourse = (code: string) => GPS_COURSES.includes(code);
export const gpsCountsForHumanities = (section: GpsSection) => section.credits.some(({ code }) => HUA_SUBJECTS.includes(code.split(" ")[0]));

export function planGpsCredit(history: Pick<DegreeHistory, "courses">, { sectionId, status, term }: GpsPick): GpsCreditPlan {
  const section = GPS_SECTIONS.find((item) => item.id === sectionId);
  if (!section) return { add: [], skipped: [], replace: [] };
  const taken = new Set(history.courses.map((course) => course.code));
  return {
    add: section.credits.filter(({ code }) => !taken.has(code)).map(({ code, credits }) => ({
      code,
      title: `${section.name} (GPS)`,
      credits,
      ...(term ? { term } : {}),
      status,
      apIb: false,
      source: "found",
      creditSource: "wpi",
    })),
    skipped: section.credits.filter(({ code }) => taken.has(code)).map(({ code }) => code),
    replace: history.courses.filter((course) => isGpsCourse(course.code)).map((course) => course.code),
  };
}
