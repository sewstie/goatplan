"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { MajorPickerFields } from "./MajorPickerFields";

export function MajorPicker({ selected }: { selected: string | null }) {
  const [open, setOpen] = useState(false);
  const title = "Choose your major";
  const form = <MajorPickerFields selected={selected} onDone={() => setOpen(false)} />;

  if (!selected) {
    return (
      <section className="mx-auto flex w-full degree-major-setup max-w-670 flex-col gap-20 rounded-panel border border-card-line bg-surface p-20 tablet:p-24">
        <h1 className="text-24 leading-30 font-700 tracking-title">{title}</h1>
        {form}
      </section>
    );
  }

  return (
    <>
      <Button variant="secondary" className="min-h-44" aria-label="Change major" onClick={() => setOpen(true)}>Change</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={title}>
        {open && form}
      </Dialog>
    </>
  );
}
