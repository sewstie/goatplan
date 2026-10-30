"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import type { Day } from "@/lib/data/types";
import { usePlanner } from "@/lib/store";
import { addBlocked } from "./blockedTimes";
import { BlockTimeDialog } from "./BlockTimeDialog";

/** The phone Preferences screen's "+ Add" and the "Block a time" form it opens as a bottom Sheet. */
export function AddBlockedTimeButton() {
  const blocked = usePlanner((state) => state.preferences.blocked);
  const setPreferences = usePlanner((state) => state.setPreferences);
  const [open, setOpen] = useState(false);

  function handleSubmit(days: Day[], start: number, end: number, label: string) {
    setPreferences({ blocked: addBlocked(blocked, days, start, end, label) });
    setOpen(false);
  }

  return (
    <>
      <Button variant="soft" size="sm" icon={<Plus aria-hidden />} aria-label="Add a blocked time" onClick={() => setOpen(true)} className="min-h-36">
        Add
      </Button>
      <BlockTimeDialog open={open} onClose={() => setOpen(false)} onSubmit={handleSubmit} />
    </>
  );
}
