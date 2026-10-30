"use client";

import type { ReactNode } from "react";
import { CourseSearchPanel } from "@/components/courses/CourseSearchPanel";
import { TermPicker } from "@/components/courses/TermPicker";
import { PhonePlanner } from "@/components/phone/PhonePlanner";
import { CourseDetailsPanel } from "@/components/sections/CourseDetailsPanel";
import { AppShell } from "@/components/shell/AppShell";
import { PlannerToast } from "@/components/shell/PlannerToast";
import { Sidebar } from "@/components/shell/Sidebar";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";

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
            <CourseDetailsPanel />
          }
        />
      )}
      {/* Rendered last and fixed to the viewport, so it's the final Tab stop and sits above the shell. */}
      <PlannerToast />
    </>
  );
}
