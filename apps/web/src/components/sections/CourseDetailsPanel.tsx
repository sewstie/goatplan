"use client";

import { useEffect, useRef } from "react";
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
  const busy = usePlanner((state) => state.solveStatus === "waiting" || state.solveStatus === "solving");
  const panel = useRef<HTMLDivElement>(null);
  const focused = useRef<HTMLElement | null>(null);
  const wasBusy = useRef(false);

  useEffect(() => {
    if (wasBusy.current && !busy && focused.current && !focused.current.isConnected && document.activeElement === document.body) {
      panel.current?.querySelector("h2")?.focus();
    }
    wasBusy.current = busy;
  }, [busy]);

  // A term that failed to load has no details panel in the design (div.app-2.md).
  if (termStatus === "error") return null;
  let content;
  if (termStatus === "idle" || termStatus === "loading") content = <PanelSkeleton />;
  else if (diagnosis && (diagnosis.issues.length > 0 || diagnosis.fixes.length > 0)) content = <DiagnosisPanel course={course} diagnosis={diagnosis} locks={locks} />;
  else if (!course) content = <PanelIntro />;
  else content = <CourseDetails key={course.code} course={course} />;
  return <div ref={panel} onFocusCapture={(event) => { focused.current = event.target as HTMLElement; }}>{content}</div>;
}
