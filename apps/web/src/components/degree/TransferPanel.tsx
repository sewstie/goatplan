"use client";

import { useRef } from "react";
import { DownloadSimple, UploadSimple } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { DrawerFrame } from "@/components/ui/Drawer";
import { Notice } from "@/components/ui/Notice";
import type { DegreeHistory } from "@/lib/degree";
import { downloadHistory } from "./degreeActions";
import { useDegreeUi } from "./degreeUi";
import { useHistoryFile } from "./useHistoryFile";

export function TransferPanel({ history, sheetReady = true }: { history: DegreeHistory; sheetReady?: boolean }) {
  const close = useDegreeUi((state) => state.close);
  const input = useRef<HTMLInputElement>(null);
  const choose = useHistoryFile(history);
  return (
    <DrawerFrame title="Import & export history" onClose={close} footer={<Button variant="secondary" size="md" className="min-h-40" onClick={close}>Done</Button>}>
      <section className="rounded-card border border-card-line px-16 py-15">
        <h3 className="text-8-5 leading-16 font-650">Take your history with you</h3>
        <p className="pt-7 text-8 leading-17 text-ink-muted">Export completed and in-progress courses, credit amounts, terms and AP/IB flags, plus your manual pins.</p>
        <Button fullWidth className="mt-14 min-h-44" icon={<DownloadSimple aria-hidden />} onClick={downloadHistory}>Download JSON</Button>
      </section>
      <section className="mt-14 rounded-card border border-card-line px-16 py-15">
        <h3 className="text-8-5 leading-16 font-650">Bring history from another device</h3>
        <p className="pt-7 text-8 leading-17 text-ink-muted">Choose a GoatPlan JSON file. You’ll review it before any courses are added.</p>
        <Button disabled={!sheetReady} variant="secondary" fullWidth className="mt-14 min-h-44" icon={<UploadSimple aria-hidden />} onClick={() => input.current?.click()}>Choose JSON file</Button>
        <input ref={input} type="file" accept=".json,application/json" aria-label="History file" tabIndex={-1} hidden onChange={(event) => void choose(event)} />
      </section>
      <Notice tone="private" className="mt-14">History stays in browser storage. It is excluded from shared schedule links.</Notice>
    </DrawerFrame>
  );
}
