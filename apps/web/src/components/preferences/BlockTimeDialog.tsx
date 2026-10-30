"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Sheet } from "@/components/ui/Sheet";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import type { Day } from "@/lib/data/types";
import { BlockTimeForm, type BlockTimeValues } from "./BlockTimeForm";

type BlockTimeDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (days: Day[], start: number, end: number, label: string) => void;
  /** What the form starts with, like a time just drawn on the calendar. */
  initial?: BlockTimeValues;
};

/** The "Block a time" form: a bottom Sheet on a phone, a Dialog on tablet and up. */
export function BlockTimeDialog({ open, onClose, onSubmit, initial }: BlockTimeDialogProps) {
  // A new key each time it opens, so the form starts over.
  const [formKey, setFormKey] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  const [error, setError] = useState<string | null>(null);
  const formId = useId();
  const errorId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const phone = usePhoneViewport();

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setFormKey((key) => key + 1);
      setError(null);
    }
  }

  // The dialog would focus its close button, which Safari outlines; start in the name field instead.
  // This runs after the dialog's own effect has opened it. The name is optional, so a phone keeps
  // the sheet's heading focus rather than popping up the keyboard.
  useEffect(() => {
    if (open && !phone) nameRef.current?.focus();
  }, [open, phone]);

  const form = (
    <BlockTimeForm
      key={formKey}
      id={formId}
      nameRef={nameRef}
      initial={initial}
      onSubmit={onSubmit}
      onError={setError}
      errorId={error ? errorId : undefined}
    />
  );

  const footer = (
    <>
      {error && (
        <p id={errorId} role="alert" className="mr-auto self-center text-9 leading-13-5 text-warning">
          {error}
        </p>
      )}
      <Button variant="secondary" size="md" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" size="md" form={formId}>
        Block time
      </Button>
    </>
  );

  return phone ? (
    <Sheet open={open} onClose={onClose} title="Block a time" side="bottom">
      <p className="text-11 leading-19-8 text-ink-muted">
        GoatPlan won&apos;t put classes in this time.
      </p>
      {form}
      <div className="flex flex-wrap justify-end gap-8 pt-9">{footer}</div>
    </Sheet>
  ) : (
    <Dialog
      open={open}
      onClose={onClose}
      title="Block a time"
      description="GoatPlan won't put classes in this time."
      footer={footer}
    >
      {form}
    </Dialog>
  );
}
