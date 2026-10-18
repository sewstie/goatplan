"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { TextInput } from "@/components/ui/TextInput";
import { cleanPlanName, MAX_PLAN_NAME_LENGTH } from "@/lib/plans";

type PlanNameDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  initialName: string;
  /** Returns an error message to show, or null when the name was taken. */
  onSubmit: (name: string) => string | null | Promise<string | null>;
  onClose: () => void;
};

export function PlanNameDialog({
  open,
  title,
  description,
  confirmLabel,
  initialName,
  onSubmit,
  onClose,
}: PlanNameDialogProps) {
  const formId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openedWith, setOpenedWith] = useState<string | null>(null);

  // Start from the suggested name each time the dialog opens.
  if (open && openedWith !== initialName) {
    setOpenedWith(initialName);
    setName(initialName);
    setError(null);
  } else if (!open && openedWith !== null) {
    setOpenedWith(null);
  }

  useEffect(() => {
    // The dialog opens in its own effect, which runs first, so the field can take focus now.
    if (!open) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const cleaned = cleanPlanName(name);
    if (!cleaned) {
      setError("Give your plan a name.");
      inputRef.current?.focus();
      return;
    }
    setBusy(true);
    const problem = await onSubmit(cleaned);
    setBusy(false);
    if (problem) setError(problem);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="pt-8">
        <TextInput
          ref={inputRef}
          label="Plan name"
          hideLabel={false}
          value={name}
          maxLength={MAX_PLAN_NAME_LENGTH}
          autoComplete="off"
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          hint={error ? <span className="text-warning">{error}</span> : undefined}
        />
        <span role="alert" className="sr-only">
          {error ?? ""}
        </span>
      </form>
    </Dialog>
  );
}
