"use client";

import { ArrowClockwise } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { usePlanner } from "@/lib/store";

export function SeatRefreshNotice() {
  const failed = usePlanner((state) => state.seatRefresh === "failed" && state.savedPlanId === null);
  const refreshSeats = usePlanner((state) => state.refreshSeats);
  if (!failed) return null;
  return (
    <Notice tone="warning" title="Couldn’t refresh seats" large>
      <p>You can keep planning with the last available counts. Check Workday before registering.</p>
      <Button variant="secondary" size="md" icon={<ArrowClockwise aria-hidden />} className="mt-12 min-h-36" onClick={() => void refreshSeats()}>
        Try again
      </Button>
    </Notice>
  );
}
