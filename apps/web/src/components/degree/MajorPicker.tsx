"use client";

import { useState } from "react";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Sheet } from "@/components/ui/Sheet";
import { MajorPickerFields } from "./MajorPickerFields";

export function MajorPicker({ selected }: { selected: string | null }) {
  const phone = usePhoneViewport();
  const [open, setOpen] = useState(false);
  const title = "Set up My degree";
  const form = <MajorPickerFields selected={selected} onDone={() => setOpen(false)} />;

  if (!selected && !phone) {
    return (
      <section className="mx-auto flex w-full degree-major-setup max-w-670 flex-col gap-20 rounded-panel border border-card-line bg-surface p-24">
        <h1 className="text-24 leading-30 font-700 tracking-title">{title}</h1>
        {form}
      </section>
    );
  }

  return (
    <>
      <Button variant="secondary" className="min-h-44" aria-label={selected ? "Change major" : "Choose your major"} onClick={() => setOpen(true)}>{selected ? "Change" : "Choose your major"}</Button>
      {phone ? (
        <Sheet open={open} onClose={() => setOpen(false)} title={title} side="bottom">
          {open && form}
        </Sheet>
      ) : (
        <Dialog open={open} onClose={() => setOpen(false)} title={title}>
          {open && form}
        </Dialog>
      )}
    </>
  );
}
