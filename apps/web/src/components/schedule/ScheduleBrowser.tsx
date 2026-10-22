"use client";

import { usePlanner } from "@/lib/store";
import { ScheduleSourceToggle } from "./ScheduleSourceToggle";
import { ScheduleSwitcher } from "./ScheduleSwitcher";
import { SavedPlanSwitcher } from "./SavedPlanSwitcher";

export function ScheduleBrowser() {
  const saved = usePlanner((state) => state.savedPlanId !== null);
  return <div className="flex min-w-0 flex-wrap items-center gap-10"><ScheduleSourceToggle />{saved ? <SavedPlanSwitcher /> : <ScheduleSwitcher />}</div>;
}
