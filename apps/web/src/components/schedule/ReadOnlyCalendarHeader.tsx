"use client";

import { ReadOnlyPreferences } from "@/components/preferences/ReadOnlyPreferences";
import { Chip } from "@/components/ui/Chip";
import type { SavedPlan } from "@/lib/plans";
import { SORT_PRESETS } from "@/lib/store";
import { ScheduleBrowser } from "./ScheduleBrowser";
import { ScheduleCountNote } from "./ScheduleCountNote";
import { ToolbarSummary } from "./ToolbarSummary";

/**
 * A saved or shared plan can't be changed, so its header needs less room: one line with the switcher,
 * the plan's preferences, what the schedule is like and Sort. It wraps only on a narrow card.
 */
export function ReadOnlyCalendarHeader({ plan }: { plan: SavedPlan }) {
  return (
    <div data-calendar-header className="shrink-0 border-b border-line">
      <div className="flex min-h-46 flex-wrap items-center gap-x-8 px-8">
        <div className="flex h-44 min-w-0 items-center gap-4 has-[#tutorial-schedules:empty]:hidden">
          <div id="tutorial-schedules" role="region" aria-label="Schedule browser" tabIndex={-1} className="min-w-0 rounded-control">
            <ScheduleBrowser />
          </div>
          <ScheduleCountNote />
        </div>
        <ReadOnlyPreferences plan={plan} withSort={false} />
        <div className="h-36 min-w-40 flex-1">
          <ToolbarSummary />
        </div>
        <Chip label="Sort" value={SORT_PRESETS[plan.sortPreset].label} className="ml-auto shrink-0 border border-line" />
      </div>
    </div>
  );
}
