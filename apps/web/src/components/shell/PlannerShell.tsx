"use client";

import type { ReactNode } from "react";
import { CourseSearchPanel } from "@/components/courses/CourseSearchPanel";
import { PhonePlanner } from "@/components/phone/PhonePlanner";
import { CourseDetailsPanel } from "@/components/sections/CourseDetailsPanel";
import { AppShell } from "@/components/shell/AppShell";
import { PlannerToast } from "@/components/shell/PlannerToast";
import { Sidebar } from "@/components/shell/Sidebar";
import { ScheduleNote } from "@/components/schedule/ScheduleNote";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";

type PlannerShellProps = {
  header: ReactNode;
  barCenter?: ReactNode;
  barActions?: ReactNode;
  toolbar?: ReactNode;
  banner: ReactNode;
  schedule: ReactNode;
};

/**
 * Wires the responsive shell together on the client: the sidebar, calendar and side details panel
 * from the tablet breakpoint up, or the phone planner's one-screen-at-a-time layout below it. Only
 * one of the two is mounted, so the tutorial target IDs never appear twice in the DOM.
 */
export function PlannerShell({ header, barCenter, barActions, toolbar, banner, schedule }: PlannerShellProps) {
  const phone = usePhoneViewport();

  return (
    <>
      {phone ? (
        <PhonePlanner banner={banner} />
      ) : (
        <AppShell
          sidebar={
            <Sidebar>
              <CourseSearchPanel />
            </Sidebar>
          }
          header={header}
          barCenter={barCenter}
          barActions={barActions}
          toolbar={toolbar}
          banner={banner}
          schedule={schedule}
          scheduleNote={<ScheduleNote />}
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
