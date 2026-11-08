"use client";

import { useState } from "react";
import { Check, PushPin, Trash } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { DrawerFrame } from "@/components/ui/Drawer";
import { Notice } from "@/components/ui/Notice";
import { codesOf, crossListed, getDegreeSource, isSmallCourse, lineName, parseUnits, type DegreeHistory } from "@/lib/degree";
import { parseTerm } from "@/lib/degree";
import { hasRegistrationCode } from "@/lib/degree/history";
import { usePublishedTerms } from "./usePublishedTerms";
import { OpenInPlanner } from "./OpenInPlanner";
import { removeCourse } from "./degreeActions";
import { useDegreeUi } from "./degreeUi";
import { coursePlanState, statusOfState } from "@/lib/degree/planGrid";
import { creditLabel } from "./creditLabel";
import { TermStatusFields, type TermAndState } from "./TermStatusFields";
import { unitsText } from "./unitsText";
import { UnitsField } from "./UnitsField";
import { useCurrentTerm } from "./useCurrentTerm";
import { usePlanStart } from "./usePlanStart";
import { UNKNOWN_COURSE_NOTE } from "./unknownCourseNote";
import { offerHintNode } from "./offerHint";
import { useTermOffers } from "./useTermOfferings";
import type { DegreeView } from "./useDegreeView";

const BAD_UNITS = "Enter WPI units, like 1/3 or 1/6.";
const SMALL_NOTE = "This may also count toward another requirement. Check with your advisor.";

export function CourseDetailsPanel({ code, history, view }: { code: string; history: DegreeHistory; view: DegreeView | null }) {
  const close = useDegreeUi((state) => state.close);
  const open = useDegreeUi((state) => state.open);
  const published = usePublishedTerms();
  const names = crossListed(code);
  const course = history.courses.find((item) => names.includes(item.code));
  const current = useCurrentTerm();
  const startYear = usePlanStart();
  const [units, setUnits] = useState(course ? unitsText(course.credits) : "");
  const [when, setWhen] = useState<TermAndState>(() => ({ term: course?.term ?? "", state: course ? coursePlanState(course, current) : "taken" }));
  const [problem, setProblem] = useState<string | null>(null);
  const offers = useTermOffers(course?.code ?? null);
  if (!course) return <DrawerFrame title="Edit course" onClose={close}><p className="text-8-5 leading-16 text-ink-muted">This course is only in your plan. Change it in the planner.</p></DrawerFrame>;

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
    const result = getDegreeSource().editCourse(course!.code, { credits, term: when.term, status: statusOfState(when.state) });
    if (result === "invalid") {
      setProblem("That change couldn’t be made, so the course stays as it was.");
      return;
    }
    setProblem(null);
    close();
  }

  return (
    <DrawerFrame
      title="Edit course"
      onClose={close}
      footer={
        <>
          <Button variant="warning" size="md" className="min-h-40" icon={<Trash aria-hidden />} onClick={() => removeCourse(course.code)}>Remove course</Button>
          <Button size="md" className="ml-auto min-h-40" icon={<Check aria-hidden />} onClick={save}>Save changes</Button>
        </>
      }
    >
      <p className="-mt-12 pb-18 text-8-5 leading-17 text-ink-muted">Keep the term if you want the course on your plan grid.</p>
      <div className="rounded-card bg-canvas px-14 py-12">
        <p className="text-10 leading-14-5 font-650">{codesOf(course.code)}</p>
        <p className="pt-2 text-8 leading-12 text-ink-muted">{[creditLabel(course), course.title].filter(Boolean).join(" · ") || "No title"}</p>
      </div>
      <div className="pt-16">
        <TermStatusFields term={when.term} state={when.state} onChange={setWhen} startYear={startYear} current={current} termLabel="Term (optional)" offers={offers} hint={when.state === "taken" ? undefined : offerHintNode(course.code, when.term, offers)} />
      </div>
      <div className="pt-16 pb-18">
        <UnitsField value={units} problem={problem === BAD_UNITS ? problem : null} onChange={(next) => { setUnits(next); setProblem(null); }} />
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
