"use client";

import { useId, useRef, useState } from "react";
import { ShareNetwork } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { selectCurrentSchedule, selectReadOnlyPlan, usePlanner } from "@/lib/store";
import { SharePanel } from "./SharePanel";

export function ShareButton() {
  const canShare = usePlanner((state) => Boolean(selectReadOnlyPlan(state)?.schedule.length || (state.termStatus === "ready" && state.solveStatus === "done" && selectCurrentSchedule(state))));
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  return (
    <>
      <Button
        ref={button}
        id="share-plan"
        variant="secondary"
        className="max-tablet:min-h-44"
        icon={<ShareNetwork aria-hidden />}
        disabled={!canShare}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        <span className="tablet:max-wide:sr-only">Share</span>
      </Button>
      {open && <SharePanel id={panelId} anchor={button} onClose={() => setOpen(false)} />}
    </>
  );
}
