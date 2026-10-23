"use client";

import type { ReactNode } from "react";
import { usePlanner } from "@/lib/store";

type DetailsPanelProps = {
  label: string;
  /** Leaves the panel out while the planner's term can't load, so the calendar takes the width (div.app-2.md). */
  hideOnTermError: boolean;
  children: ReactNode;
};

/** The panel to the right of the calendar, or under it on narrow screens. */
export function DetailsPanel({ label, hideOnTermError, children }: DetailsPanelProps) {
  const hasCourses = usePlanner((state) => state.courses.length > 0 || state.savedPlanId !== null);
  const termFailed = usePlanner((state) => state.termStatus === "error");
  if (hideOnTermError && termFailed) return null;
  return (
    <aside
      aria-label={label}
      data-guide-hide={hideOnTermError && !hasCourses ? "" : undefined}
      className="flex flex-col rounded-panel bg-surface px-16 py-20 wide:w-(--size-details) wide:shrink-0 wide:overflow-y-auto"
    >
      {children}
    </aside>
  );
}
