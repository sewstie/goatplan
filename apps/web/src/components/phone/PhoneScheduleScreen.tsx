"use client";

import type { ReactNode } from "react";
import { PlanActions } from "@/components/plans/PlanActions";
import { ScheduleBrowser } from "@/components/schedule/ScheduleBrowser";
import { ScheduleSummary } from "@/components/schedule/ScheduleSummary";
import { ScheduleView } from "@/components/schedule/ScheduleView";
import { useDiagnosis } from "@/components/schedule/useDiagnosis";
import { CourseDetailsPanel } from "@/components/sections/CourseDetailsPanel";
import { usePlanner } from "@/lib/store";
import { CourseChips } from "./CourseChips";
import { PhonePreferenceChips } from "./PhonePreferenceChips";
import { SearchTrigger } from "./SearchTrigger";

/**
 * The phone home screen: search, the planned courses, the schedule header and preferences, then the
 * week calendar. When nothing fits, the "Needs attention" card takes the calendar's place, or goes
 * under it in drawing mode.
 */
export function PhoneScheduleScreen({ banner }: { banner: ReactNode }) {
  const diagnosis = useDiagnosis();
  const attention = diagnosis !== null && (diagnosis.issues.length > 0 || diagnosis.fixes.length > 0);
  const drawing = usePlanner((state) => state.drawing);
  const attentionCard = (
    <section aria-label="Needs attention" className="rounded-panel border border-line bg-surface px-16 pt-20 pb-16">
      <CourseDetailsPanel />
    </section>
  );

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
              <ScheduleSummary steady />
            </div>
          </header>
        )}
      />
      <PhonePreferenceChips />
      {banner}
      {attention && !drawing && attentionCard}
      <div data-guide-slot="schedules" className="empty:hidden" />
      {/* Hidden rather than gone, so "Block time" works from here: drawing mode lives in the calendar. */}
      <section hidden={attention && !drawing} aria-label="Weekly schedule" className="relative overflow-hidden rounded-panel border border-line bg-surface">
        <ScheduleView />
      </section>
      {/* While drawing, the week stays in view so the time that caused the problem can be erased. */}
      {attention && drawing && attentionCard}
    </div>
  );
}
