"use client";

import { PreferencesBar } from "@/components/preferences/PreferencesBar";
import { SortSelect } from "@/components/preferences/SortSelect";
import { selectReadOnlyPlan, usePlanner } from "@/lib/store";
import { ReadOnlyCalendarHeader } from "./ReadOnlyCalendarHeader";
import { ScheduleBrowser } from "./ScheduleBrowser";
import { ScheduleCountNote } from "./ScheduleCountNote";
import { ToolbarSummary } from "./ToolbarSummary";

/**
 * The top of the calendar card: Preferences first, then the switcher, what this schedule is like and Sort.
 * A wide card fits the second part on one line; a narrow one puts the chips on a line of their own.
 */
export function CalendarHeader() {
  const plan = usePlanner(selectReadOnlyPlan);
  if (plan) return <ReadOnlyCalendarHeader plan={plan} />;
  return (
    <div data-calendar-header className="@container shrink-0 border-b border-line">
      <div className="border-b border-line px-8">
        <PreferencesBar />
      </div>
      <div className="flex flex-wrap items-center gap-x-8 px-8 @[45rem]:h-46 @[45rem]:flex-nowrap">
        <div className="flex h-44 min-w-0 items-center gap-4">
          <div id="tutorial-schedules" role="region" aria-label="Schedule browser" tabIndex={-1} className="min-w-0 rounded-control">
            <ScheduleBrowser />
          </div>
          <ScheduleCountNote />
        </div>
        <div className="order-last h-36 w-full @[45rem]:order-none @[45rem]:h-full @[45rem]:w-auto @[45rem]:min-w-0 @[45rem]:flex-1">
          <ToolbarSummary />
        </div>
        <div className="ml-auto flex h-44 shrink-0 items-center">
          <SortSelect className="shrink-0" />
        </div>
      </div>
    </div>
  );
}
