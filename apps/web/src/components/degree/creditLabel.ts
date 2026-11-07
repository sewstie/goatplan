import type { HistoryCourse } from "@/lib/degree";

const LABELS = { transfer: "Transfer", ap: "AP", ib: "IB", other: "Other credit", wpi: null } as const;

export function creditLabel(course: HistoryCourse): string | null {
  if (course.creditSource) return LABELS[course.creditSource];
  return course.apIb ? "AP/IB" : null;
}
