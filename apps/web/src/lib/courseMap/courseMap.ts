import type { Course } from "@/lib/data/types";
import csBackground from "./cs-background.json";

export type Background = { course: string } | { note: string } | { all: Background[] } | { any: Background[] };

export interface MapSource {
  code: string;
  title: string;
  aliases?: string[];
  source: string;
  wording: string;
  background: Background | null;
}

export interface MapNode extends MapSource {
  band: number;
  offering: Course | null;
  backgroundCurated: boolean;
}

export interface CourseMap {
  nodes: MapNode[];
  connections: { from: string; to: string }[];
}

const sources = csBackground as MapSource[];

function courseCodes(background: Background | null): string[] {
  if (!background || "note" in background) return [];
  if ("course" in background) return [background.course];
  return ("all" in background ? background.all : background.any).flatMap(courseCodes);
}

export function buildCourseMap(courses: readonly Course[], records: readonly MapSource[] = sources): CourseMap {
  const nodes = new Map(records.map((record) => [record.code, record]));
  for (const record of records) {
    for (const code of courseCodes(record.background)) {
      if (!nodes.has(code)) nodes.set(code, { code, title: code, source: record.source, wording: "This source mentions the course as background. This connected course’s own background has not been curated here.", background: null });
    }
  }
  return {
    nodes: [...nodes.values()].map((record) => ({ ...record, backgroundCurated: records.some((source) => source.code === record.code), band: Math.floor(Number(record.code.split(" ")[1]) / 1000) * 1000, offering: courses.find((course) => [record.code, ...(record.aliases ?? [])].includes(course.code)) ?? null })),
    connections: records.flatMap((record) => [...new Set(courseCodes(record.background))].map((from) => ({ from, to: record.code }))),
  };
}
