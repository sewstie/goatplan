"use client";

import { Button } from "@/components/ui/Button";
import { DrawerFrame } from "@/components/ui/Drawer";
import { Notice } from "@/components/ui/Notice";
import { getDegreeSource, type ImportPreview } from "@/lib/degree";
import { FileCard } from "./FileCard";
import { finishImport } from "./finishImport";
import { useDegreeUi } from "./degreeUi";

const count = (number: number) => `${number} ${number === 1 ? "course" : "courses"}`;

function Tally({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <span className="text-22 leading-30 font-650 text-accent">{value}</span>
      <span className="text-8 leading-14-4 text-ink-muted">{label}</span>
    </div>
  );
}

export function ImportReviewPanel({ preview }: { preview: ImportPreview }) {
  const close = useDegreeUi((state) => state.close);
  const open = useDegreeUi((state) => state.open);
  const { incoming, fileName, newCourses, alreadyHere, existing, pins } = preview;
  const hasPins = pins.length > 0;

  return (
    <DrawerFrame
      title="Review history import"
      onClose={close}
      footer={
        <>
          <Button variant="secondary" size="md" className="min-h-40" onClick={close}>Cancel</Button>
          <Button
            size="md"
            className="min-h-40"
            onClick={() => {
              if (hasPins) open({ kind: "importPins", preview });
              else {
                getDegreeSource().mergeHistory(incoming);
                finishImport(preview);
              }
            }}
          >
            Import {count(newCourses)}
          </Button>
        </>
      }
    >
      <p className="-mt-6 pb-16 text-8-5 leading-17 text-ink-muted">Review this history before adding it to this browser.</p>
      <FileCard name={fileName} text={`Valid GoatPlan export · ${count(incoming.courses.length)}`} />
      <div className="grid grid-cols-3 gap-8 py-22">
        <Tally value={newCourses} label="new courses" />
        <Tally value={alreadyHere} label="already here" />
        <Tally value={0} label="invalid records" />
      </div>
      {existing > 0 && (
        <Notice title="Add to your existing history" className="mb-12">
          {count(existing)} {existing === 1 ? "is" : "are"} already on this device. Duplicates will be skipped. Your current schedule and preferences won’t change.
        </Notice>
      )}
      {hasPins && <Notice title="Manual pins included">Valid assignments are restored with the history. Ineligible pins are reported separately, without discarding valid records.</Notice>}
    </DrawerFrame>
  );
}
