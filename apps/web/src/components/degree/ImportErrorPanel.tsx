"use client";

import { useRef } from "react";
import { UploadSimple } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { DrawerFrame } from "@/components/ui/Drawer";
import { Notice } from "@/components/ui/Notice";
import type { DegreeHistory, FileProblem } from "@/lib/degree";
import { FileCard } from "./FileCard";
import { useDegreeUi } from "./degreeUi";
import { useHistoryFile } from "./useHistoryFile";

function reason({ badRecords, badCredits }: FileProblem, version: boolean): string {
  if (version) return "It’s from a different version of GoatPlan.";
  if (badCredits === 1 && badRecords === 1) return "One record has an invalid credit amount.";
  if (badRecords === 1) return "One record can’t be read.";
  if (badRecords > 1) return `${badRecords} records can’t be read.`;
  return "It isn’t a GoatPlan history.";
}

export function ImportErrorPanel({ fileName, problem, version, history }: { fileName: string; problem: FileProblem; version: boolean; history: DegreeHistory }) {
  const close = useDegreeUi((state) => state.close);
  const input = useRef<HTMLInputElement>(null);
  const choose = useHistoryFile(history);
  const existing = history.courses.length;
  return (
    <DrawerFrame
      title="Your history is unchanged"
      onClose={close}
      footer={
        <>
          <Button variant="secondary" size="md" className="min-h-40" onClick={close}>Keep my history</Button>
          <Button size="md" className="min-h-40" icon={<UploadSimple aria-hidden />} onClick={() => input.current?.click()}>Choose another file</Button>
        </>
      }
    >
      <FileCard name={fileName} text="Import could not be completed" />
      <Notice tone="warning" title="This file isn’t a valid history export" className="mt-16">
        {reason(problem, version)} Nothing was imported; {existing === 1 ? "your 1 existing course is" : `all ${existing} existing courses are`} unchanged.
      </Notice>
      <p className="pt-18 text-8-5 leading-17 text-ink-muted">Try a fresh GoatPlan export, or choose another JSON file.</p>
      <p className="pt-18 text-8-5 leading-17 text-ink-muted">Existing pins are unchanged too.</p>
      <input ref={input} type="file" accept=".json,application/json" aria-label="History file" tabIndex={-1} hidden onChange={(event) => void choose(event)} />
    </DrawerFrame>
  );
}
