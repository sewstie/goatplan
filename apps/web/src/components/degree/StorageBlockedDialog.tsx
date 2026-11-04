"use client";

import { useState } from "react";
import { ArrowClockwise, DownloadSimple } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { PageDialog } from "@/components/ui/PageDialog";
import { getDegreeSource, type DegreeHistory, type DegreeSnapshot } from "@/lib/degree";
import { downloadHistory } from "./degreeActions";

export function StorageBlockedDialog({ degree }: { degree: DegreeSnapshot }) {
  const [dismissedFor, setDismissedFor] = useState<DegreeHistory | null>(null);
  if (!degree.unsaved || dismissedFor === degree.history) return null;
  return (
    <PageDialog
      open
      wide
      onClose={() => setDismissedFor(degree.history)}
      title="Keep a copy of your changes"
      description="This browser couldn’t save the change to your history or pins."
      breadcrumb="My degree / Course assignment"
      footer={
        <>
          <Button variant="secondary" size="md" className="min-h-38" icon={<ArrowClockwise aria-hidden />} onClick={() => getDegreeSource().saveAgain()}>Try saving again</Button>
          <Button variant="secondary" size="md" className="min-h-38" onClick={() => setDismissedFor(degree.history)}>Keep planning</Button>
        </>
      }
    >
      <Notice tone="warning" title="Not saved on this device" className="mt-20">Your changes are available in this open session. Export a copy before closing the page.</Notice>
      <Button fullWidth className="mt-16 min-h-44" icon={<DownloadSimple aria-hidden />} onClick={downloadHistory}>Export history &amp; pins</Button>
      <p className="pt-6 text-8-5 leading-16 text-ink-muted">We won’t show a Saved confirmation until the write succeeds.</p>
    </PageDialog>
  );
}
