"use client";

import { useState } from "react";
import { Circle, CheckCircle, Info } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { DrawerFrame } from "@/components/ui/Drawer";
import { codesOf, lineLabel, moveTargets, unavailableExample, type DegreeHistory } from "@/lib/degree";
import { requestMove } from "./degreeActions";
import { useDegreeUi } from "./degreeUi";
import { SummaryCard } from "./SummaryCard";
import type { DegreeView } from "./useDegreeView";

export function MoveLinePanel({ code, view, history }: { code: string; view: DegreeView; history: DegreeHistory }) {
  const close = useDegreeUi((state) => state.close);
  const credits = view.courses.get(code)?.credits ?? 0;
  const targets = moveTargets(code, credits, view.sheet);
  const current = targets.find((target) => target.current)?.line ?? null;
  const [chosen, setChosen] = useState<number | null>(current);
  const example = unavailableExample(code, credits);

  return (
    <DrawerFrame
      title="Move to line…"
      onClose={close}
      footer={
        <>
          <Button variant="secondary" size="md" className="max-tablet:flex-1 min-h-40" onClick={close}>Cancel</Button>
          <Button size="md" className="max-tablet:flex-1 min-h-40" disabled={chosen === null || chosen === current} onClick={() => chosen !== null && requestMove(view, history, { code, line: chosen })}>Move &amp; pin</Button>
        </>
      }
    >
      <SummaryCard eyebrow={`Move ${codesOf(code)}`} title="Choose an allowed line" />
      <p className="pt-20 pb-20 text-8-5 leading-17 text-ink-muted">Moving a course pins it. Your choice stays when the sheet updates.</p>
      <div role="radiogroup" aria-label="Allowed lines" className="overflow-hidden rounded-card border border-card-line">
        {targets.map((target) => {
          const selected = chosen === target.line;
          return (
            <label key={target.line} className={cx("flex min-h-73 cursor-pointer items-center gap-13 border-b border-card-line px-17 last:border-b-0", selected && "bg-notice-info outline-1 -outline-offset-1 outline-chart-planned")}>
              <input type="radio" name="move-line" className="peer sr-only" checked={selected} onChange={() => setChosen(target.line)} />
              {selected ? <CheckCircle aria-hidden className="size-16 shrink-0" /> : <Circle aria-hidden className="size-16 shrink-0" />}
              <span className="peer-focus-visible:underline">
                <span className="block text-8-5 leading-17 font-650">{target.title}</span>
                <span className="block pt-3 text-8 leading-14-4 text-ink-muted">{target.text}</span>
              </span>
            </label>
          );
        })}
      </div>
      {example !== null && (
        <div className="flex gap-11 pt-30">
          <Info aria-hidden className="mt-1 size-16 shrink-0" />
          <div>
            <p className="text-8-5 leading-16 font-600">Other lines aren’t available</p>
            <p className="pt-7 text-8 leading-14-4 text-ink-muted">{code} cannot fill {lineLabel(example)}, line {example}. Only allowed targets are selectable.</p>
          </div>
        </div>
      )}
    </DrawerFrame>
  );
}
