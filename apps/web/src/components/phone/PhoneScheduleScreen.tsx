"use client";

import type { ReactNode } from "react";
import { PlanActions } from "@/components/plans/PlanActions";
import { ScheduleBrowser } from "@/components/schedule/ScheduleBrowser";
import { ScheduleSummary } from "@/components/schedule/ScheduleSummary";
import { ScheduleView } from "@/components/schedule/ScheduleView";
import { useDiagnosis } from "@/components/schedule/useDiagnosis";
import { CourseDetailsPanel } from "@/components/sections/CourseDetailsPanel";
import { CourseChips } from "./CourseChips";
import { PhonePreferenceChips } from "./PhonePreferenceChips";
import { SearchTrigger } from "./SearchTrigger";

/**
 * The phone home screen: search, the planned courses, the schedule header and preferences, then the
 * week calendar. When nothing fits, the "Needs attention" card takes the calendar's place.
 */
export function PhoneScheduleScreen({ banner }: { banner: ReactNode }) {
  const diagnosis = useDiagnosis();
  const attention = diagnosis !== null && (diagnosis.issues.length > 0 || diagnosis.fixes.length > 0);

  return (
    <div className="flex flex-col gap-12">
      <div data-guide-slot="term" className="empty:hidden" />
      <SearchTrigger />
      <CourseChips />
      <PlanActions
        layout={({ menu, save }) => (
          <header className="flex flex-col gap-10">
            <div className="flex items-center justify-between gap-8">
              <h1 data-screen-heading tabIndex={-1} className="text-21 leading-30 font-700 tracking-title outline-none">
                Schedule planner
              </h1>
              {menu}
            </div>
            <div id="tutorial-schedules" role="region" aria-label="Schedule browser" tabIndex={-1} className="flex min-w-0 rounded-control empty:hidden">
              <ScheduleBrowser wide />
            </div>
            {save}
            <div className="text-9 text-ink-muted">
              <ScheduleSummary />
            </div>
          </header>
        )}
      />
      <PhonePreferenceChips />
      {banner}
      {attention ? (
        <>
          <section aria-label="Needs attention" className="rounded-panel border border-line bg-surface px-16 pt-20 pb-16">
            <CourseDetailsPanel />
          </section>
          <div data-guide-slot="schedules" className="empty:hidden" />
        </>
      ) : (
        <>
          <div data-guide-slot="schedules" className="empty:hidden" />
          <section aria-label="Weekly schedule" className="overflow-hidden rounded-panel border border-line bg-surface">
            <ScheduleView />
          </section>
        </>
      )}
    </div>
  );
}
