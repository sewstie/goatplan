"use client";

import { useId, useRef, useState } from "react";
import { GraduationCap } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { AddToDegreePanel } from "./AddToDegreePanel";
import { useAddPlanToDegree } from "./useAddPlanToDegree";

export function AddToDegreeButton() {
  const { ready, reason } = useAddPlanToDegree();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  return (
    <>
      <Button
        ref={button}
        variant="secondary"
        icon={<GraduationCap aria-hidden />}
        disabled={!ready}
        title={reason || undefined}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        <span className="tablet:max-wide:sr-only">Add to degree</span>
      </Button>
      {open && <AddToDegreePanel id={panelId} anchor={button} onClose={() => setOpen(false)} />}
    </>
  );
}
