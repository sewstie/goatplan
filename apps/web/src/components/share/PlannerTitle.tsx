"use client";

import { Badge } from "@/components/ui/Badge";
import { usePlanner } from "@/lib/store";

/** "Schedule planner", or "Shared schedule" with its badge while viewing someone's link. The toolbar shows the badge where the title is hidden. */
export function PlannerTitle({ badge = true }: { badge?: boolean } = {}) {
  const shared = usePlanner((state) => state.temporaryPlan !== null);
  if (!shared) return <>Schedule planner</>;
  if (!badge) return <>Shared schedule</>;
  return (
    <span className="inline-flex flex-wrap items-center gap-12">
      Shared schedule
      <Badge tone="accent" size="lg" className="font-570 [letter-spacing:0]">Shared snapshot</Badge>
    </span>
  );
}
