"use client";

import { usePlanner } from "@/lib/store";
import { CourseDetails } from "./CourseDetails";
import { PanelIntro } from "./PanelIntro";
import { PanelSkeleton } from "./PanelSkeleton";
import { useSelectedCourse } from "./useSelectedCourse";

/** The details panel: section choices, Lock / Unlock and the professor, or the intro when no course is picked. */
export function CourseDetailsPanel() {
  const code = useSelectedCourse();
  const loading = usePlanner((state) => state.termStatus === "idle" || state.termStatus === "loading");
  const course = usePlanner((state) => (code ? state.term?.courses.find((item) => item.code === code) : undefined));

  if (loading) return <PanelSkeleton />;
  if (!course) return <PanelIntro />;
  return <CourseDetails key={course.code} course={course} />;
}
