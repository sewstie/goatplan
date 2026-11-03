"use client";

import type { ReactNode } from "react";
import { PlanActions } from "@/components/plans/PlanActions";
import { PlannerTitle } from "@/components/share/PlannerTitle";
import { BarMoreMenu } from "@/components/shell/BarMoreMenu";
import { SeatStatus } from "@/components/shell/SeatStatus";
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
export function PhoneScheduleScreen({ banner, notices }: { banner: ReactNode; notices?: ReactNode }) {
  const diagnosis = useDiagnosis();
  const attention = diagnosis !== null && (diagnosis.issues.length > 0 || diagnosis.fixes.length > 0);
  const drawing = usePlanner((state) => state.drawing);
  const shared = usePlanner((state) => state.temporaryPlan !== null);
  const attentionCard = (
    <section aria-label="Needs attention" className="rounded-panel border border-line bg-surface px-16 pt-20 pb-16">
      <CourseDetailsPanel />
    </section>
  );

  return (
    <div className="flex flex-col gap-8">
      <div data-guide-slot="term" className="empty:hidden" />
      {!shared && <SearchTrigger />}
      {!shared && <CourseChips oneRow />}
      <PlanActions
        layout={({ menu, share, exportButton, saveButton, unsaved }) => {
          const browser = (
            <div id="tutorial-schedules" role="region" aria-label="Schedule browser" tabIndex={-1} className="flex min-w-0 flex-1 rounded-control empty:hidden">
              <ScheduleBrowser wide />
            </div>
          );
          return (
            <header className="flex flex-col gap-8">
              <div className="flex items-center justify-between gap-8">
                <h1 data-screen-heading tabIndex={-1} className="text-21 leading-30 font-700 tracking-title outline-none">
                  <PlannerTitle />
                </h1>
                {!shared && (
                  <div className="flex shrink-0 items-center gap-6">
                    {menu}
                    <BarMoreMenu>
                      {share}
                      {exportButton}
                    </BarMoreMenu>
                  </div>
                )}
              </div>
              {shared ? (
                <>
                  {browser}
                  {saveButton}
                </>
              ) : (
                <div className="flex items-stretch gap-8">
                  {browser}
                  <div className="ml-auto shrink-0">{saveButton}</div>
                </div>
              )}
              <div className="text-9 text-ink-muted">
                <ScheduleSummary steady aside={unsaved ? "Unsaved changes" : null} />
              </div>
            </header>
          );
        }}
      />
      <SeatStatus />
      <PhonePreferenceChips />
      <div data-guide-slot="availability" className="empty:hidden" />
      {banner}
      {attention && !drawing && attentionCard}
      <div data-guide-slot="schedules" className="empty:hidden" />
      {/* Hidden rather than gone, so "Block time" works from here: drawing mode lives in the calendar. */}
      <section hidden={attention && !drawing} aria-label="Weekly schedule" className="relative overflow-hidden rounded-panel border border-line bg-surface">
        <ScheduleView />
      </section>
      {/* While drawing, the week stays in view so the time that caused the problem can be erased. */}
      {attention && drawing && attentionCard}
      {notices}
    </div>
  );
}
