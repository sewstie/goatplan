"use client";

import type { ReactNode } from "react";
import { useHeldHeight } from "@/components/schedule/useHeldHeight";
import { usePlanner } from "@/lib/store";

/** A long "Schedule 1 of 200" can wrap where "0 schedules fit" doesn't, and the calendar mustn't move while drawing. */
export function HeaderTop({ children }: { children: ReactNode }) {
  const drawing = usePlanner((state) => state.drawing);
  const [ref, style] = useHeldHeight<HTMLDivElement>(drawing);
  return (
    <div ref={ref} style={style} className="flex flex-wrap items-start justify-between gap-x-8 gap-y-8 wide:flex-nowrap">
      {children}
    </div>
  );
}
