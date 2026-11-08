import type { MapNode } from "@/lib/courseMap/courseMap";
import { foundCourse, typedCourse, type DegreeSource } from "@/lib/degree";

export function planMapCourse(source: DegreeSource, node: MapNode, term: string) {
  const names = [node.code, ...(node.aliases ?? [])];
  const existing = source.getSnapshot().history.courses.find((course) => names.includes(course.code));
  if (existing) return source.editCourse(existing.code, { term });
  return source.addCourse({ ...(node.offering ? foundCourse(node.offering) : { ...typedCourse(node.code), title: node.title }), status: "planned", term });
}
