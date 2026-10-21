"use client";

import { useMemo } from "react";
import { useSectionPreview } from "@/components/sections/sectionPreview";
import { usePlanner } from "@/lib/store";
import { scheduleItems } from "./scheduleItems";

export function useSectionPreviewItems() {
  const courseCode = useSectionPreview((state) => state.courseCode);
  const sectionId = useSectionPreview((state) => state.sectionId);
  const term = usePlanner((state) => state.term);
  const courses = usePlanner((state) => state.courses);
  const selectedCourse = usePlanner((state) => state.selectedCourse);
  const solveStatus = usePlanner((state) => state.solveStatus);

  return useMemo(() => {
    if (!courseCode || !sectionId || selectedCourse !== courseCode || solveStatus !== "done") return [];
    return scheduleItems(term, courses, { [courseCode]: [sectionId] }, {}).classes
      .map((item) => ({ ...item, key: `preview:${item.key}`, preview: true, choicePreview: true }));
  }, [courseCode, sectionId, term, courses, selectedCourse, solveStatus]);
}
