"use client";

import { LockSimple, LockSimpleOpen } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { usePlanner } from "@/lib/store";

type LockButtonProps = {
  courseCode: string;
  sectionId: string;
  /** "Lab CX02", so screen readers hear what gets locked. */
  sectionName: string;
  locked: boolean;
};

/** "Lock" keeps only schedules with this section; "Unlock" lets the planner pick again. */
export function LockButton({ courseCode, sectionId, sectionName, locked }: LockButtonProps) {
  const lockSection = usePlanner((state) => state.lockSection);
  const unlockSection = usePlanner((state) => state.unlockSection);
  const action = locked ? "Unlock" : "Lock";

  return (
    <Button
      variant="soft"
      size="xs"
      icon={locked ? <LockSimpleOpen aria-hidden /> : <LockSimple aria-hidden />}
      aria-label={`${action} ${sectionName}`}
      onClick={() => (locked ? unlockSection(courseCode, sectionId) : lockSection(courseCode, sectionId))}
    >
      {action}
    </Button>
  );
}
