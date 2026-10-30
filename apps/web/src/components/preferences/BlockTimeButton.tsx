"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import type { Day } from "@/lib/data/types";
import { usePlanner } from "@/lib/store";
import { addBlocked } from "./blockedTimes";
import { BlockTimeDialog } from "./BlockTimeDialog";

/**
 * The dashed "Block a time" pill, or the phone Preferences screen's "+ Add", and the form it opens.
 * On a phone the form is a bottom Sheet; on tablet+, a Dialog.
 */
export function BlockTimeButton({ variant = "chip", label = "Block a time", className }: { variant?: "chip" | "add"; label?: string; className?: string } = {}) {
  const blocked = usePlanner((state) => state.preferences.blocked);
  const setPreferences = usePlanner((state) => state.setPreferences);
  const [open, setOpen] = useState(false);

  function handleSubmit(days: Day[], start: number, end: number, label: string) {
    setPreferences({ blocked: addBlocked(blocked, days, start, end, label) });
    setOpen(false);
  }

  return (
    <>
      {variant === "add" ? (
        <Button variant="soft" size="sm" icon={<Plus aria-hidden />} aria-label="Add a blocked time" onClick={() => setOpen(true)} className="min-h-36">
          Add
        </Button>
      ) : (
        <Chip id="tutorial-block-time" variant="dashed" icon={<Plus />} onClick={() => setOpen(true)} className={className}>
          {label}
        </Chip>
      )}
      <BlockTimeDialog open={open} onClose={() => setOpen(false)} onSubmit={handleSubmit} />
    </>
  );
}
