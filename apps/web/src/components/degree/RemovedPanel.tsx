"use client";

import { CheckCircle } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { DrawerFrame } from "@/components/ui/Drawer";
import { Notice } from "@/components/ui/Notice";
import type { DegreeHistory } from "@/lib/degree";
import { undoTo } from "./degreeActions";
import { useDegreeUi } from "./degreeUi";
import { HistoryTabs } from "./HistoryPanel";

export function RemovedPanel({ code, previous }: { code: string; previous: DegreeHistory }) {
  const close = useDegreeUi((state) => state.close);
  const open = useDegreeUi((state) => state.open);
  return (
    <DrawerFrame
      title="Course history"
      onClose={close}
      tabs={<HistoryTabs tab="history" />}
      footer={<Button size="md" className="min-h-40" onClick={close}>Back to the sheet</Button>}
    >
      <div role="status" className="flex items-center gap-10 rounded-card bg-toast-dark px-15 py-12 text-8-5 leading-16 text-on-dark shadow-guide">
        <CheckCircle aria-hidden className="size-16 shrink-0" />
        <span className="flex-1">{code} removed from history.</span>
        <button
          type="button"
          onClick={() => {
            undoTo(previous);
            open({ kind: "history", tab: "history" });
          }}
          className="cursor-pointer rounded-badge font-650 underline"
        >
          Undo
        </button>
      </div>
      <p className="py-20 text-8-5 leading-17 text-ink-muted">The course and its pin are removed together. The sheet is recalculated from the remaining history.</p>
      <Notice title="Planned copies stay planned">Removing a completed record never marks an in-progress copy as done.</Notice>
    </DrawerFrame>
  );
}
