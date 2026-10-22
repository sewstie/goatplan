"use client";

import { LockSimple, LockSimpleOpen } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { usePlanner } from "@/lib/store";
import type { Ref } from "react";

type LockButtonProps = {
  courseCode: string;
  sectionId: string;
  /** "Lab CX02", so screen readers hear what gets locked. */
  sectionName: string;
  locked: boolean;
  onLock?: () => void;
  onUnlocked?: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
};

/** "Lock" keeps only schedules with this section; "Unlock" lets the planner pick again. */
export function LockButton({ courseCode, sectionId, sectionName, locked, onLock, onUnlocked, buttonRef }: LockButtonProps) {
  const lockSection = usePlanner((state) => state.lockSection);
  const unlockSection = usePlanner((state) => state.unlockSection);
  const action = locked ? "Unlock" : "Lock";

  return (
    <Button
      ref={buttonRef}
      variant="soft"
      size="xs"
      icon={locked ? <LockSimpleOpen aria-hidden /> : <LockSimple aria-hidden />}
      aria-label={`${action} ${sectionName}`}
      onClick={() => {
        if (!locked) {
          if (onLock) onLock();
          else lockSection(courseCode, sectionId);
          return;
        }
        unlockSection(courseCode, sectionId);
        onUnlocked?.();
      }}
    >
      {action}
    </Button>
  );
}
