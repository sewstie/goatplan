"use client";

import { cx } from "@/components/ui/cx";
import { usePlanner } from "@/lib/store";
import { ScheduleSwitcher } from "./ScheduleSwitcher";
import { SavedPlanSwitcher } from "./SavedPlanSwitcher";
import { useHeldHeight } from "./useHeldHeight";

/**
 * `compact` is the small switcher beside "Back to schedule" on the phone course screen; `wide` fills
 * its row on the phone schedule screen.
 */
export function ScheduleBrowser({ compact = false, wide = false }: { compact?: boolean; wide?: boolean }) {
  const saved = usePlanner((state) => state.savedPlanId !== null);
  const drawing = usePlanner((state) => state.drawing);
  const [heldRef, heldStyle] = useHeldHeight<HTMLDivElement>(drawing && !compact);
  if (saved) return compact ? null : <SavedPlanSwitcher wide={wide} />;
  const switcher = <ScheduleSwitcher compact={compact} wide={wide} />;
  // In drawing mode "Schedule 1 of 4" and "0 schedules fit" take the same height, so the header doesn't move.
  if (!drawing || compact) return switcher;
  return (
    <div ref={heldRef} style={heldStyle} className={cx("flex min-w-0 items-center", wide && "flex-1")}>
      {switcher}
    </div>
  );
}
