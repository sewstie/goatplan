"use client";

import { usePlanner } from "@/lib/store";
import { useDiagnosis } from "@/components/schedule/useDiagnosis";
import { CourseDetails } from "./CourseDetails";
import { DiagnosisPanel } from "./DiagnosisPanel";
import { PanelIntro } from "./PanelIntro";
import { PanelSkeleton } from "./PanelSkeleton";

/** The details panel: section choices, Lock / Unlock and the professor, or the intro when no course is picked. */
export function CourseDetailsPanel() {
  const code = usePlanner((state) => state.selectedCourse);
  const termStatus = usePlanner((state) => state.termStatus);
  const course = usePlanner((state) => (code ? state.term?.courses.find((item) => item.code === code) : undefined));
  const locks = usePlanner((state) => state.locks);
  const diagnosis = useDiagnosis();

  if (termStatus === "idle" || termStatus === "loading") return <PanelSkeleton />;
  // A term that failed to load has no details panel in the design (div.app-2.md).
  if (termStatus === "error") return null;
  if (diagnosis && (diagnosis.issues.length > 0 || diagnosis.fixes.length > 0)) {
    return <DiagnosisPanel course={course} diagnosis={diagnosis} locks={locks} />;
  }
  if (!course) return <PanelIntro />;
  return <CourseDetails key={course.code} course={course} />;
}
