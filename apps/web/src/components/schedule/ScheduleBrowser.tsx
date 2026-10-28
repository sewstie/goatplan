"use client";

import { usePlanner } from "@/lib/store";
import { ScheduleSwitcher } from "./ScheduleSwitcher";
import { SavedPlanSwitcher } from "./SavedPlanSwitcher";

/**
 * `compact` is the small switcher beside "Back to schedule" on the phone course screen; `wide` fills
 * its row on the phone schedule screen.
 */
export function ScheduleBrowser({ compact = false, wide = false }: { compact?: boolean; wide?: boolean }) {
  const saved = usePlanner((state) => state.savedPlanId !== null);
  if (saved) return compact ? null : <SavedPlanSwitcher wide={wide} />;
  return <ScheduleSwitcher compact={compact} wide={wide} />;
}
