"use client";

import { useMemo } from "react";
import { diagnosticPreview } from "@/lib/diagnosis/diagnosticPreview";
import { usePlanner } from "@/lib/store";
import { scheduleItems } from "./scheduleItems";
import { useDiagnosis } from "./useDiagnosis";

export function useDiagnosticPreview() {
  const term = usePlanner((state) => state.term);
  const courses = usePlanner((state) => state.courses);
  const preferences = usePlanner((state) => state.preferences);
  const locks = usePlanner((state) => state.locks);
  const professorByCourse = usePlanner((state) => state.professorByCourse);
  const last = usePlanner((state) => state.lastChosenSections);
  const diagnosis = useDiagnosis();
  return useMemo(() => {
    const issues = diagnosis?.issues ?? [];
    const chosen = diagnosticPreview(term, courses, { preferences, locks, professorByCourse }, last, issues);
    const items = scheduleItems(term, courses, chosen, locks);
    const problem = new Set(issues.flatMap((issue) => issue.problemSectionIds));
    return { ...items, hasDiagnosis: issues.length > 0, classes: items.classes.map((item) => ({ ...item, preview: true, problem: problem.has(item.sectionId) })) };
  }, [term, courses, preferences, locks, professorByCourse, last, diagnosis]);
}
