"use client";

import { ArrowsLeftRight } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { DrawerFrame } from "@/components/ui/Drawer";
import { historyForLine, lineLabel, sectionNameOfLine, type DegreeHistory } from "@/lib/degree";
import { requestMove } from "./degreeActions";
import { SUGGESTIONS_ON } from "./degreeFeatures";
import { useDegreeUi } from "./degreeUi";
import { LineCourseList } from "./LineCourseList";
import { SummaryCard } from "./SummaryCard";
import type { DegreeView } from "./useDegreeView";

export function FillLinePanel({ line, view, history }: { line: number; view: DegreeView; history: DegreeHistory }) {
  const close = useDegreeUi((state) => state.close);
  const open = useDegreeUi((state) => state.open);

  const fromHistory = historyForLine(line, history, view.sheet.sections, view.result.freeElectives.courses);
  return (
    <DrawerFrame title={`Courses that fit line ${line}`} onClose={close}>
      <SummaryCard eyebrow={sectionNameOfLine(line)} title={`Line ${line} · ${lineLabel(line)}`} />
      {fromHistory.length > 0 && (
        <section aria-label="From your history" className="border-b border-line py-18">
          <h3 className="pb-14 text-8-5 leading-16 font-650">From your history</h3>
          <ul className="flex flex-col gap-16">
            {fromHistory.map((fit) => (
              <li key={fit.code}>
                <p className="text-8-5 leading-16 font-650">{fit.codes}</p>
                <p className="pt-5 text-8 leading-14-4 text-ink-muted">{fit.text}</p>
                <Button variant="secondary" size="sm" icon={<ArrowsLeftRight aria-hidden />} aria-label={`Move ${fit.code} here`} className="mt-10 min-h-36" onClick={() => requestMove(view, history, { code: fit.code, line })}>Move here</Button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {SUGGESTIONS_ON && (
        <div className="border-b border-line py-18">
          <Button variant="secondary" onClick={() => open({ kind: "suggest", line })}>Suggest courses for this line</Button>
        </div>
      )}
      <LineCourseList line={line} view={view} history={history} />
    </DrawerFrame>
  );
}
