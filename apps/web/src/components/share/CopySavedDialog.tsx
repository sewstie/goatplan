"use client";

import { useState } from "react";
import { CheckCircle } from "@phosphor-icons/react/ssr";
import { termLabel } from "@/lib/plans";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { PageDialog } from "@/components/ui/PageDialog";
import { TextInput } from "@/components/ui/TextInput";
import { getPlansSource, type SavedPlan } from "@/lib/plans";

type CopySavedDialogProps = {
  plan: SavedPlan;
  onClose(): void;
  onBackToDraft(): void;
  onEdit(): void;
};

export function CopySavedDialog({ plan, onClose, onBackToDraft, onEdit }: CopySavedDialogProps) {
  const [name, setName] = useState(plan.name);

  function rename() {
    const clean = name.trim();
    if (clean && clean !== plan.name) getPlansSource().save({ ...plan, name: clean });
  }

  function leaving(next: () => void) {
    return () => {
      rename();
      next();
    };
  }

  return (
    <PageDialog
      open
      onClose={leaving(onClose)}
      title="A copy is saved"
      breadcrumb={`Planner / ${termLabel(plan.term)}`}
      footer={
        <>
          <Button variant="secondary" size="md" onClick={leaving(onBackToDraft)}>Back to my draft</Button>
          <Button size="md" onClick={leaving(onEdit)}>Edit this copy</Button>
        </>
      }
    >
      <div className="flex flex-col items-center pt-12 text-center">
        <CheckCircle aria-hidden className="size-40 text-ink" />
        <p className="pt-14 text-14 leading-22 font-650">{name.trim() || plan.name}</p>
        <p className="pt-6 text-8-5 leading-16 text-ink-muted">Saved separately from your own draft.</p>
      </div>
      <TextInput label="Saved plan name" hideLabel={false} value={name} onChange={(event) => setName(event.target.value)} onBlur={rename} className="pt-18" />
      <Notice title="Ready when you are" className="mt-16">Open this copy to change sections or preferences. Your original draft stays saved.</Notice>
    </PageDialog>
  );
}
