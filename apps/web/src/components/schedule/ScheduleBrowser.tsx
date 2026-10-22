"use client";

import { usePlanner } from "@/lib/store";
import { ScheduleSwitcher } from "./ScheduleSwitcher";
import { SavedPlanSwitcher } from "./SavedPlanSwitcher";

export function ScheduleBrowser() {
  const saved = usePlanner((state) => state.savedPlanId !== null);
  return saved ? <SavedPlanSwitcher /> : <ScheduleSwitcher />;
}
