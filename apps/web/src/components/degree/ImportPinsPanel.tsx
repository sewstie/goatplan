"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DrawerFrame } from "@/components/ui/Drawer";
import { Notice } from "@/components/ui/Notice";
import { getDegreeSource, type ImportPreview } from "@/lib/degree";
import { shortLine } from "./degreeActions";
import { FileCard } from "./FileCard";
import { finishImport } from "./finishImport";
import { useDegreeUi } from "./degreeUi";

export function ImportPinsPanel({ preview }: { preview: ImportPreview }) {
  const close = useDegreeUi((state) => state.close);
  const { incoming, fileName, pins } = preview;
  return (
    <DrawerFrame
      title="Review history & pins"
      onClose={close}
      footer={
        <>
          <Button variant="secondary" size="md" className="min-h-40" onClick={close}>Cancel</Button>
          <Button
            size="md"
            className="min-h-40"
            onClick={() => {
              const allowed = pins.filter((pin) => pin.allowed).map(({ code, line }) => ({ code, line }));
              getDegreeSource().mergeHistory({ ...incoming, pins: allowed });
              finishImport(preview);
            }}
          >
            Import history &amp; pins
          </Button>
        </>
      }
    >
      <FileCard name={fileName} text={`${incoming.courses.length} course records · ${pins.length} manual ${pins.length === 1 ? "pin" : "pins"}`} />
      <ul className="py-6">
        {pins.map((pin) => (
          <li key={`${pin.code}-${pin.line}`} className="flex items-center justify-between gap-12 border-b border-line py-14 last:border-b-0">
            <p className="text-8-5 leading-16 font-600">{pin.code} → {shortLine(pin.line)}</p>
            <Badge tone={pin.allowed ? "success" : "warning"}>{pin.allowed ? "Allowed" : "Not allowed"}</Badge>
          </li>
        ))}
      </ul>
      <Notice title="Nothing has changed yet">Confirm to merge the records and restore eligible pins. Schedule-sharing links never include history or pins.</Notice>
    </DrawerFrame>
  );
}
