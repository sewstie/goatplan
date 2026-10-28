"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { CourseSearchPanel } from "@/components/courses/CourseSearchPanel";
import { TermPicker } from "@/components/courses/TermPicker";
import { PhonePlanner } from "@/components/phone/PhonePlanner";
import { CourseDetailsPanel } from "@/components/sections/CourseDetailsPanel";
import { ChooseAlternativeSheet } from "@/components/sections/ChooseAlternativeSheet";
import { AppShell } from "@/components/shell/AppShell";
import { Sidebar } from "@/components/shell/Sidebar";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { Toast } from "@/components/ui/Toast";
import { usePlanner } from "@/lib/store";

type PlannerShellProps = {
  header: ReactNode;
  toolbar: ReactNode;
  banner: ReactNode;
  schedule: ReactNode;
};

/**
 * Wires the responsive shell together on the client: the sidebar, calendar and side details panel
 * from the tablet breakpoint up, or the phone planner's one-screen-at-a-time layout below it. Only
 * one of the two is mounted, so the tutorial target IDs never appear twice in the DOM.
 */
export function PlannerShell({ header, toolbar, banner, schedule }: PlannerShellProps) {
  const phone = usePhoneViewport();

  const removedCourse = usePlanner((state) => state.removedCourse);
  const undoRemoveCourse = usePlanner((state) => state.undoRemoveCourse);
  const dismissRemovedCourse = usePlanner((state) => state.dismissRemovedCourse);

  // The code of the course a student just chose to undo. Set in the click handler and read by the
  // effect below once React has re-rendered with the course back in the list, so focus can land on
  // the restored row. A dismiss (timeout) never sets this, so the two paths stay distinct.
  const undoneCodeRef = useRef<string | null>(null);

  const handleUndo = useCallback(() => {
    if (!removedCourse) return;
    undoneCodeRef.current = removedCourse.code;
    undoRemoveCourse();
  }, [removedCourse, undoRemoveCourse]);

  useEffect(() => {
    const code = undoneCodeRef.current;
    if (removedCourse !== null || !code) return;
    undoneCodeRef.current = null;
    document.querySelector<HTMLElement>(`[data-course-row="${CSS.escape(code)}"]`)?.focus();
  }, [removedCourse]);

  return (
    <>
      {phone ? (
        <PhonePlanner banner={banner} />
      ) : (
        <AppShell
          sidebar={
            <Sidebar>
              <TermPicker />
              <CourseSearchPanel />
            </Sidebar>
          }
          header={header}
          toolbar={toolbar}
          banner={banner}
          schedule={schedule}
          hideDetailsOnTermError
          details={
            <>
              <CourseDetailsPanel />
              <ChooseAlternativeSheet />
            </>
          }
        />
      )}
      {/* Rendered last and fixed to the viewport, so it's the final Tab stop and sits above the shell. */}
      <Toast
        message={removedCourse ? `Removed ${removedCourse.code}` : null}
        action={{ label: "Undo", onAction: handleUndo }}
        onDismiss={dismissRemovedCourse}
      />
    </>
  );
}
