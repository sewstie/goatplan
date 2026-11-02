"use client";

import { ArrowsLeftRight, PushPin } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { PageDialog } from "@/components/ui/PageDialog";
import { lineLabel, lineName, sectionNameOfLine } from "@/lib/degree";
import { keepPin } from "./degreeActions";
import { useDegreeUi } from "./degreeUi";

export function KeepPinDialog() {
  const ask = useDegreeUi((state) => state.keepPin);
  const set = useDegreeUi((state) => state.set);
  if (!ask) return null;
  const { pin, outcome } = ask;
  const fewer = outcome.best - outcome.withPin;
  const emptied = outcome.emptied[0]?.id;
  const headline = emptied ? `${sectionNameOfLine(emptied) === "Computer science" ? "CS" : sectionNameOfLine(emptied)} line ${emptied} would be empty` : `${fewer} ${fewer === 1 ? "line" : "lines"} would be empty`;
  const close = () => set({ keepPin: null });
  return (
    <PageDialog
      open
      wide
      onClose={close}
      title="Keep this pin?"
      description={`You can keep this choice, but it fills ${fewer === 1 ? "one fewer line" : `${fewer} fewer lines`}.`}
      breadcrumb="My degree / Course assignment"
      footer={
        <>
          <Button size="md" className="min-h-38" onClick={close}>Use best fit</Button>
          <Button variant="secondary" size="md" className="min-h-38" icon={<PushPin aria-hidden />} onClick={() => keepPin(pin)}>Keep pin</Button>
        </>
      }
    >
      <div className="flex items-center justify-center gap-30 py-24">
        <div className="w-136 rounded-card border border-card-line bg-canvas px-17 py-17">
          <p className="text-8 leading-14-4 text-ink-muted">Best fit</p>
          <p className="pt-5 text-22 leading-30 font-650">{outcome.best} lines</p>
        </div>
        <ArrowsLeftRight aria-hidden className="size-16 text-ink-muted" />
        <div className="w-136 rounded-card border border-tile-check-line bg-tile-check px-17 py-17">
          <p className="text-8 leading-14-4 text-ink-muted">With this pin</p>
          <p className="pt-5 text-22 leading-30 font-650 text-notice-warning-ink">{outcome.withPin} lines</p>
        </div>
      </div>
      <Notice tone="warning" title={headline}>
        Pinning {pin.code} to {lineName(pin.line)}{outcome.displaced ? ` displaces ${outcome.displaced}` : ` leaves ${emptied ? lineLabel(emptied) : "its old line"} open`}.
        {outcome.freeElectiveCourse && ` ${outcome.freeElectiveCourse} can fill a free elective, but cannot replace ${pin.code} on ${emptied ? `a ${sectionNameOfLine(emptied) === "Computer science" ? "CS" : sectionNameOfLine(emptied)} line` : "that line"}.`}
      </Notice>
      <p className="pt-18 text-8-5 leading-16 text-ink-muted">The pin is not saved until you choose Keep pin.</p>
    </PageDialog>
  );
}
