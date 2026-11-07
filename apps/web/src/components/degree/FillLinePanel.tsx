"use client";

import { useState, type FormEvent } from "react";
import { ArrowsLeftRight } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { DrawerFrame } from "@/components/ui/Drawer";
import { TextInput } from "@/components/ui/TextInput";
import { cleanCourseCode, findCourse, foundCourse, getDegreeSource, historyForLine, lineLabel, loadCatalog, sectionNameOfLine, typedCourse, type DegreeHistory } from "@/lib/degree";
import { requestMove } from "./degreeActions";
import { SUGGESTIONS_ON } from "./degreeFeatures";
import { useDegreeUi } from "./degreeUi";
import { SummaryCard } from "./SummaryCard";
import type { DegreeView } from "./useDegreeView";

const BAD_CODE = "That doesn’t look like a course code. Try one like CS 2102.";

export function FillLinePanel({ line, view, history }: { line: number; view: DegreeView; history: DegreeHistory }) {
  const close = useDegreeUi((state) => state.close);
  const open = useDegreeUi((state) => state.open);
  const [typed, setTyped] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  const fromHistory = historyForLine(line, history, view.sheet.sections, view.result.freeElectives.courses);
  async function addTyped(event: FormEvent) {
    event.preventDefault();
    const code = cleanCourseCode(typed);
    if (!code) {
      setProblem(BAD_CODE);
      return;
    }
    const { courses } = await loadCatalog();
    const found = findCourse(courses, code);
    const result = getDegreeSource().addCourse(found ? foundCourse(found) : typedCourse(code));
    if (result === "duplicate") {
      setProblem(`${code} is already in your history.`);
      return;
    }
    setTyped("");
    setProblem(null);
  }

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
      <form onSubmit={(event) => void addTyped(event)} noValidate className="pt-18">
        <h3 className="pb-14 text-8-5 leading-16 font-650">Type a code</h3>
        <TextInput
          label="AP, transfer or retired course"
          hideLabel={false}
          placeholder="Course code"
          autoComplete="off"
          spellCheck={false}
          value={typed}
          aria-invalid={problem ? true : undefined}
          hint={problem && <span role="alert">{problem}</span>}
          onChange={(event) => {
            setTyped(event.target.value);
            setProblem(null);
          }}
        />
        <p className="pt-14 text-8-5 leading-17 text-ink-muted">Add the record to history, then review where it counts.</p>
      </form>
    </DrawerFrame>
  );
}
