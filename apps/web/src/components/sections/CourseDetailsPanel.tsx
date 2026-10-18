"use client";

import { usePlanner } from "@/lib/store";
import { CourseDetails } from "./CourseDetails";
import { PanelIntro } from "./PanelIntro";
import { PanelSkeleton } from "./PanelSkeleton";
import { useSelectedCourse } from "./useSelectedCourse";

/** The details panel: section choices, Lock / Unlock and the professor, or the intro when no course is picked. */
export function CourseDetailsPanel() {
  const code = useSelectedCourse();
  const termStatus = usePlanner((state) => state.termStatus);
  const course = usePlanner((state) => (code ? state.term?.courses.find((item) => item.code === code) : undefined));

  if (termStatus === "idle" || termStatus === "loading") return <PanelSkeleton />;
  // A term that failed to load has no details panel in the design (div.app-2.md).
  if (termStatus === "error") return null;
  if (!course) return <PanelIntro />;
  return <CourseDetails key={course.code} course={course} />;
}
