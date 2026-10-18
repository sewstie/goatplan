"use client";

import { useId, useState } from "react";
import { Plus } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Dialog } from "@/components/ui/Dialog";
import type { Day } from "@/lib/data/types";
import { usePlanner } from "@/lib/store";
import { addBlocked } from "./blockedTimes";
import { BlockTimeForm } from "./BlockTimeForm";

/** The dashed "Block a time" pill and the form it opens. */
export function BlockTimeButton() {
  const blocked = usePlanner((state) => state.preferences.blocked);
  const setPreferences = usePlanner((state) => state.setPreferences);
  const [open, setOpen] = useState(false);
  // A new key each time the dialog opens, so the form starts empty.
  const [formKey, setFormKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const formId = useId();
  const errorId = useId();

  function handleSubmit(days: Day[], start: number, end: number) {
    setPreferences({ blocked: addBlocked(blocked, days, start, end) });
    setOpen(false);
  }

  return (
    <>
      <Chip
        variant="dashed"
        icon={<Plus />}
        onClick={() => {
          setFormKey((key) => key + 1);
          setError(null);
          setOpen(true);
        }}
      >
        Block a time
      </Chip>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Block a time"
        description="GoatPlan won’t put classes in this time."
        footer={
          <>
            {error && (
              <p id={errorId} role="alert" className="mr-auto self-center text-9 leading-13-5 text-warning">
                {error}
              </p>
            )}
            <Button variant="secondary" size="md" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            {/* Without this the border stays darker than the hover fill and reads as an outline. */}
            <Button type="submit" size="md" form={formId} className="enabled:hover:border-transparent">
              Block time
            </Button>
          </>
        }
      >
        <BlockTimeForm
          key={formKey}
          id={formId}
          onSubmit={handleSubmit}
          onError={setError}
          errorId={error ? errorId : undefined}
        />
      </Dialog>
    </>
  );
}
