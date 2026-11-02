"use client";

import { useRef, useState } from "react";
import { Info } from "@phosphor-icons/react/ssr";
import { useDismiss } from "@/components/ui/useDismiss";
import { useDiagnosis } from "./useDiagnosis";
import { useScheduleMessage } from "./useScheduleMessage";

/** The small ⓘ beside the schedule count. Its place is always kept, so the count doesn't move when it appears. */
export function ScheduleCountNote() {
  const message = useScheduleMessage();
  const diagnosis = useDiagnosis();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const shown = message && message.tone !== "loading" && !diagnosis?.issues[0] ? message : null;
  const expanded = open && shown !== null;
  useDismiss(expanded, root, () => setOpen(false));

  return (
    <div ref={root} className="relative size-24 shrink-0">
      {shown && (
        <button
          type="button"
          aria-label="About these schedules"
          aria-expanded={expanded}
          onClick={() => setOpen(!open)}
          className="flex size-24 cursor-pointer items-center justify-center rounded-badge text-accent hover:bg-surface-selected"
        >
          <Info aria-hidden className="size-14" />
        </button>
      )}
      {expanded && (
        <div className="absolute top-full left-1/2 z-30 mt-8 w-300 -translate-x-1/2 rounded-card border border-line-popover bg-surface p-12 text-9 leading-13 text-ink-soft shadow-popover">
          <p className="font-650 text-ink">{shown.title}</p>
          <p className="pt-4">{shown.detail}</p>
        </div>
      )}
    </div>
  );
}
