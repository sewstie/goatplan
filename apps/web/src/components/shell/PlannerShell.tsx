"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CourseSearchPanel } from "@/components/courses/CourseSearchPanel";
import { TermPicker } from "@/components/courses/TermPicker";
import { YourCoursesDisclosure } from "@/components/courses/YourCoursesDisclosure";
import { CourseDetailsPanel } from "@/components/sections/CourseDetailsPanel";
import { ChooseAlternativeSheet } from "@/components/sections/ChooseAlternativeSheet";
import { AppShell } from "@/components/shell/AppShell";
import { DataUpdated } from "@/components/shell/DataUpdated";
import { PhoneDetailsProvider } from "@/components/shell/phoneDetails";
import { PhoneDetailsSheet } from "@/components/shell/PhoneDetailsSheet";
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
 * Wires the responsive shell together on the client: the tablet sidebar and side details panel, plus
 * the phone-only "Your courses" disclosure and the bottom details sheet. The sheet's open state lives
 * here (not in the planner store) so it opens only on a deliberate tap and closing keeps the selection.
 *
 * Only one of the sidebar and the disclosure is mounted at a time, chosen by the viewport, so the
 * term picker and search box (which carry the tutorial target IDs) never appear twice in the DOM.
 */
export function PlannerShell({ header, toolbar, banner, schedule }: PlannerShellProps) {
  const phone = usePhoneViewport();
  const [phoneSheetOpen, setPhoneSheetOpen] = useState(false);
  const openPhoneDetails = useCallback(() => setPhoneSheetOpen(true), []);
  const closePhoneDetails = useCallback(() => setPhoneSheetOpen(false), []);

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

  // After an undo clears removedCourse and the course is back in the list, move focus to its row.
  // On a phone the "Your courses" disclosure may be collapsed; open it first so the row is mounted.
  useEffect(() => {
    const code = undoneCodeRef.current;
    if (removedCourse !== null || !code) return;
    undoneCodeRef.current = null;

    const focusRow = () => {
      const row = document.querySelector<HTMLElement>(`[data-course-row="${CSS.escape(code)}"]`);
      row?.focus();
    };

    if (phone) {
      const button = document.querySelector<HTMLButtonElement>(
        '[data-your-courses-disclosure][aria-expanded="false"]',
      );
      if (button) {
        button.click();
        // Let the disclosure open and render its children before reaching for the row.
        requestAnimationFrame(focusRow);
        return;
      }
    }
    focusRow();
  }, [removedCourse, phone]);

  const courses = (
    <>
      <TermPicker />
      <CourseSearchPanel />
    </>
  );

  return (
    <PhoneDetailsProvider onOpen={openPhoneDetails}>
      <AppShell
        sidebar={phone ? null : <Sidebar>{courses}</Sidebar>}
        phoneDisclosure={phone ? <YourCoursesDisclosure>{courses}</YourCoursesDisclosure> : null}
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
        phoneSheet={
          phone ? (
            <PhoneDetailsSheet open={phoneSheetOpen} onClose={closePhoneDetails}>
              <CourseDetailsPanel />
            </PhoneDetailsSheet>
          ) : null
        }
        phoneFooter={phone ? <DataUpdated /> : null}
      />
      {/* Rendered last and fixed to the viewport, so it's the final Tab stop and sits above the shell. */}
      <Toast
        message={removedCourse ? `Removed ${removedCourse.code}` : null}
        action={{ label: "Undo", onAction: handleUndo }}
        onDismiss={dismissRemovedCourse}
      />
    </PhoneDetailsProvider>
  );
}
