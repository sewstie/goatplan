"use client";

import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { CheckField } from "@/components/ui/CheckField";
import { DrawerFrame } from "@/components/ui/Drawer";
import { Notice } from "@/components/ui/Notice";
import { findCourse, foundCourse, getDegreeSource, parsePastedCourses, typedCourse, unitLabel, type DegreeHistory, type HistoryCourse } from "@/lib/degree";
import { useDegreeUi } from "./degreeUi";
import { UNKNOWN_COURSE_NOTE } from "./unknownCourseNote";
import { useCourseCatalog } from "./useCourseCatalog";

type Row = { course: HistoryCourse; already: boolean; ticked: boolean };

const count = (number: number) => `${number} ${number === 1 ? "course" : "courses"}`;

function rowText({ course, already }: Row): string {
  if (already) return "Already in history · duplicate will not be added";
  const parts = [...(course.term ? [course.term] : []), unitLabel(course.credits), course.inProgress ? "in progress" : "completed"];
  return parts.join(" · ");
}

export function AddSeveralTab({ history, tabs }: { history: DegreeHistory; tabs: ReactNode }) {
  const close = useDegreeUi((state) => state.close);
  const open = useDegreeUi((state) => state.open);
  const catalog = useCourseCatalog();
  const textId = useId();
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const found = parsePastedCourses(text);

  async function review() {
    const { courses } = await catalog.load();
    const known = new Set(history.courses.map((course) => course.code));
    setRows(found.map(({ code, term, inProgress }) => {
      const match = findCourse(courses, code);
      const course: HistoryCourse = { ...(match ? foundCourse(match) : typedCourse(code)), inProgress, ...(term ? { term } : {}) };
      const already = known.has(code);
      return { course, already, ticked: !already };
    }));
  }

  if (rows) {
    const chosen = rows.filter((row) => row.ticked);
    const already = rows.filter((row) => row.already).length;
    return (
      <DrawerFrame
        title="Review detected courses"
        onClose={close}
        tabs={tabs}
        footer={
          <>
            <Button variant="secondary" size="md" className="min-h-40" onClick={() => setRows(null)}>Back</Button>
            <Button
              size="md"
              className="min-h-40"
              disabled={chosen.length === 0}
              onClick={() => {
                getDegreeSource().addCourses(chosen.map((row) => row.course));
                open({ kind: "history", tab: "history" });
              }}
            >
              Add {count(chosen.length)}
            </Button>
          </>
        }
      >
        <p className="pb-20 text-8-5 leading-17 text-ink-muted">Choose which detected courses to add. Nothing has been saved yet.</p>
        <div className="flex items-center justify-between gap-12 border-b border-line pb-11">
          <p className="text-8-5 leading-16 font-600">{rows.length} detected</p>
          <p className="text-8 leading-14-4 text-ink-muted">{chosen.length} selected{already > 0 ? ` · ${already} already in history` : ""}</p>
        </div>
        <ul aria-label="Courses found">
          {rows.map((row) => (
            <li key={row.course.code} className="border-b border-line py-14 last:border-b-0">
              <CheckField
                label={row.course.code}
                labelClassName="text-8-5 leading-16 font-650"
                description={<>{rowText(row)}{!row.already && row.course.source === "typed" && <><br />{UNKNOWN_COURSE_NOTE}</>}</>}
                aria-label={`Add ${row.course.code}`}
                checked={row.ticked}
                disabled={row.already}
                onChange={(event) => setRows(rows.map((item) => (item === row ? { ...item, ticked: event.target.checked } : item)))}
              />
            </li>
          ))}
        </ul>
        <Notice title={`${chosen.length} ready to add`} className="mt-14">No grades, names or unrelated pasted text are included. Edit credit and term details after adding.</Notice>
      </DrawerFrame>
    );
  }

  return (
    <DrawerFrame
      title="Paste courses from Workday"
      onClose={close}
      tabs={tabs}
      footer={
        <>
          <Button variant="secondary" size="md" className="min-h-40" onClick={close}>Cancel</Button>
          <Button size="md" className="min-h-40" disabled={found.length === 0} onClick={() => void review()}>Review {count(found.length)}</Button>
        </>
      }
    >
      <p className="pb-20 text-8-5 leading-17 text-ink-muted">Copy your course list from Workday. You’ll review the detected courses before adding anything.</p>
      <label htmlFor={textId} className="pb-7 text-8-5 leading-16 font-600 text-ink-soft">Workday course text</label>
      <textarea
        id={textId}
        rows={10}
        value={text}
        onChange={(event) => setText(event.target.value)}
        autoComplete="off"
        spellCheck={false}
        className="w-full resize-y rounded-card border border-card-line bg-card-field px-17 py-16 text-[1rem] leading-[1.3rem] text-ink outline-none focus-visible:border-choice-line focus-visible:shadow-field-focus tablet:text-8-5 tablet:leading-[1.3rem]"
      />
      <Notice tone="private" className="mt-8">Only course information is kept. Grades and unrelated pasted information are discarded.</Notice>
    </DrawerFrame>
  );
}
