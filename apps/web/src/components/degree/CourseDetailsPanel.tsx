"use client";

import { useState } from "react";
import { PushPin, Trash } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { CheckField } from "@/components/ui/CheckField";
import { DrawerFrame } from "@/components/ui/Drawer";
import { Notice } from "@/components/ui/Notice";
import { Select } from "@/components/ui/Select";
import { TextInput } from "@/components/ui/TextInput";
import { codesOf, crossListed, formatUnits, getDegreeSource, isSmallCourse, lineName, parseUnits, type DegreeHistory } from "@/lib/degree";
import { parseTerm } from "@/lib/degree";
import { hasRegistrationCode } from "@/lib/degree/history";
import { usePublishedTerms } from "./usePublishedTerms";
import { OpenInPlanner } from "./OpenInPlanner";
import { removeCourse } from "./degreeActions";
import { useDegreeUi } from "./degreeUi";
import { termChoices } from "./termChoices";
import { UNKNOWN_COURSE_NOTE } from "./unknownCourseNote";
import type { DegreeView } from "./useDegreeView";

const BAD_UNITS = "Enter WPI units, like 1/3 or 1/6.";
const SMALL_NOTE = "This may also count toward another requirement. Check with your advisor.";

export function CourseDetailsPanel({ code, history, view }: { code: string; history: DegreeHistory; view: DegreeView | null }) {
  const close = useDegreeUi((state) => state.close);
  const open = useDegreeUi((state) => state.open);
  const published = usePublishedTerms();
  const names = crossListed(code);
  const course = history.courses.find((item) => names.includes(item.code));
  const [units, setUnits] = useState(course ? formatUnits(course.credits).replace("⅓", "1/3").replace("⅙", "1/6").replace("⅔", "2/3") : "");
  const [term, setTerm] = useState(course?.term ?? "");
  const [status, setStatus] = useState<"taken" | "planned">(course?.status ?? "taken");
  const [apIb, setApIb] = useState(course?.apIb ?? false);
  const [problem, setProblem] = useState<string | null>(null);
  if (!course) return <DrawerFrame title="Course details" onClose={close}><p className="text-8-5 leading-16 text-ink-muted">This course is only in your plan. Change it in the planner.</p></DrawerFrame>;

  const tile = view?.sheet.sections.flatMap((section) => section.tiles).find((item) => item.course !== null && names.includes(item.course));
  const crossList = names.length > 1;
  const named = parseTerm(course.term);
  const termId = named ? `${named.year}-${named.letter}` : null;

  function save() {
    const credits = parseUnits(units);
    if (credits === null) {
      setProblem(BAD_UNITS);
      return;
    }
    const result = getDegreeSource().editCourse(course!.code, { credits, term, status, ...(apIb !== course!.apIb ? { apIb } : {}) });
    if (result === "invalid") {
      setProblem("That change couldn’t be made, so the course stays as it was.");
      return;
    }
    setProblem(null);
    close();
  }

  return (
    <DrawerFrame
      title="Course details"
      onClose={close}
      footer={
        <div className="flex w-full flex-col gap-10">
          <Button fullWidth className="min-h-40" onClick={save}>Save changes</Button>
          <Button variant="secondary" fullWidth className="min-h-40" icon={<Trash aria-hidden />} onClick={() => removeCourse(course.code)}>Remove course</Button>
        </div>
      }
    >
      <TextInput label="Course code" hideLabel={false} readOnly value={codesOf(course.code)} />
      <div className="grid grid-cols-2 gap-16 pt-16">
        <TextInput
          label="Units"
          hideLabel={false}
          autoComplete="off"
          value={units}
          aria-invalid={problem === BAD_UNITS ? true : undefined}
          hint={problem === BAD_UNITS && <span role="alert">{problem}</span>}
          onChange={(event) => {
            setUnits(event.target.value);
            setProblem(null);
          }}
        />
        <Select label="Term" hideLabel={false} variant="box" options={termChoices()} value={term} onChange={(event) => setTerm(event.target.value)} />
      </div>
      <div className="flex flex-col gap-22 py-22">
        <Select label="Status" hideLabel={false} variant="box" options={[{ value: "taken", label: "Taken" }, { value: "planned", label: "Planned" }]} value={status} onChange={(event) => setStatus(event.target.value as "taken" | "planned")} />
        {(course.source === "typed" || course.apIb) && <CheckField label="AP / IB credit" checked={apIb} onChange={(event) => setApIb(event.target.checked)} />}
      </div>
      {course.status === "planned" && termId && published.terms.some((term) => term.id === termId) && <OpenInPlanner termId={termId} />}
      {course.status === "planned" && termId && published.status === "failed" && <div role="alert"><p className="pb-8 text-8 text-ink-muted">Published terms couldn’t be loaded.</p><Button variant="secondary" onClick={published.retry}>Try again</Button></div>}
      {crossList && tile && <Notice title="Counted once">This cross-listed record currently fills {lineName(tile.line)}.</Notice>}
      {course.source === "typed" && <Notice tone="warning" title="Needs your review">{hasRegistrationCode(course.code) ? UNKNOWN_COURSE_NOTE : "This catalog entry needs a numbered WPI course code before it can count. Keep it here for review, or add the registered course manually."}</Notice>}
      {isSmallCourse(course.credits) && <p className="pt-10 text-8 leading-14-4 text-ink-muted">{SMALL_NOTE}</p>}
      {problem && problem !== BAD_UNITS && <p role="alert" className="pt-10 text-8-5 leading-16 text-notice-warning-ink">{problem}</p>}
      <div className="mt-18 flex items-center justify-between gap-12 border-t border-line pt-16">
        <p className="flex items-center gap-8 text-8 leading-14-4 text-ink-muted">
          <PushPin aria-hidden className="size-14 text-ink" />
          {tile?.pinned ? `Pinned to ${lineName(tile.line)}` : "No manual assignment"}
        </p>
        <button type="button" disabled={!view || !hasRegistrationCode(course.code)} onClick={() => open({ kind: "move", code: course.code })} className="cursor-pointer rounded-badge text-8 leading-14-4 font-600 text-accent hover:underline">Move to line…</button>
      </div>
    </DrawerFrame>
  );
}
