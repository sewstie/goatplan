"use client";

import { useId, useRef, useState } from "react";
import { Export } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { selectCurrentSchedule, selectReadOnlyPlan, usePlanner } from "@/lib/store";
import { ExportPanel } from "./ExportPanel";

export function AddToCalendarButton() {
  const canExport = usePlanner((state) => Boolean(state.term && (selectReadOnlyPlan(state)?.schedule.length || (state.termStatus === "ready" && state.solveStatus === "done" && selectCurrentSchedule(state)))));
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  return (
    <>
      <Button
        ref={button}
        variant="secondary"
        className="max-tablet:min-h-44"
        icon={<Export aria-hidden />}
        disabled={!canExport}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        Export
      </Button>
      {open && <ExportPanel id={panelId} anchor={button} onClose={() => setOpen(false)} />}
    </>
  );
}
