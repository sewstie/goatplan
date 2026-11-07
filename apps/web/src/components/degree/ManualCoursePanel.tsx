"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { DrawerFrame } from "@/components/ui/Drawer";
import { Notice } from "@/components/ui/Notice";
import { TextInput } from "@/components/ui/TextInput";
import { cleanCourseCode, EXAMS, getDegreeSource, parseTerm, parseUnits, planExamCredit, termLong, typedCourse, type CreditSource, type DegreeHistory, type ExamProgram, type HistoryCourse } from "@/lib/degree";
import { defaultAddTerm, stateForTerm, statusOfState } from "@/lib/degree/planGrid";
import { AddedStatus, type Added } from "./AddedStatus";
import { AddTargetCard } from "./AddTargetCard";
import { ChoiceChips } from "./ChoiceChips";
import { useDegreeUi } from "./degreeUi";
import { ExamCreditFields, type ExamChoice } from "./ExamCreditFields";
import { PLAN_STATES } from "./planStateLook";
import { UnitsField } from "./UnitsField";
import { useAddTarget } from "./useAddTarget";

type Source = Extract<CreditSource, "wpi" | "ap" | "ib">;

const SOURCES: { value: Source; label: string }[] = [
  { value: "wpi", label: "WPI" },
  { value: "ap", label: "AP" },
  { value: "ib", label: "IB" },
];

const PROGRAMS: Partial<Record<Source, ExamProgram>> = { ap: "AP", ib: "IB" };

const NO_EXAM: ExamChoice = { examId: "", score: null };

type Problem = { field: "code" | "units" | "form"; text: string };

export function ManualCoursePanel({ history, initialCode = "" }: { history: DegreeHistory; initialCode?: string }) {
  const close = useDegreeUi((state) => state.close);
  const open = useDegreeUi((state) => state.open);
  const { target, change, current, startYear } = useAddTarget();
  const [source, setSource] = useState<Source>("wpi");
  const [typing, setTyping] = useState(false);
  const [code, setCode] = useState(initialCode);
  const [units, setUnits] = useState("1/3");
  const [title, setTitle] = useState("");
  const [exam, setExam] = useState<ExamChoice>(NO_EXAM);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [added, setAdded] = useState<Added | null>(null);
  const program = PROGRAMS[source];
  const byExam = program !== undefined && !typing;
  const examPlan = byExam && exam.examId && exam.score !== null ? planExamCredit(history, [{ examId: exam.examId, score: exam.score }]) : null;
  const examCount = examPlan?.add.length ?? 0;
  const where = target.term || "your history";
  const stateWord = PLAN_STATES[target.state].label.toLowerCase();

  function pickSource(next: Source) {
    setSource(next);
    setProblem(null);
    setExam(NO_EXAM);
    setTyping(false);
    if (next === "wpi" && !target.term) {
      const term = termLong(defaultAddTerm(startYear, current));
      change({ term, state: stateForTerm(parseTerm(term), current) });
    } else if (next !== "wpi" && source === "wpi") {
      change({ term: "", state: "taken" });
    }
  }

  const placed = (course: HistoryCourse): HistoryCourse => {
    const next = { ...course, status: statusOfState(target.state) };
    if (target.term) next.term = target.term;
    else delete next.term;
    return next;
  };

  function done(codes: string[], unsaved: boolean) {
    setAdded({ codes, text: `${codes.join(", ")} added to ${where} as ${stateWord}.${unsaved ? " Browser storage is unavailable." : ""}`, undo: true });
    setCode("");
    setTitle("");
    setExam(NO_EXAM);
  }

  function addTyped() {
    const clean = cleanCourseCode(code);
    if (!clean) {
      setProblem({ field: "code", text: "That doesn’t look like a course code. Try one like CS 2102." });
      return;
    }
    const credits = parseUnits(units);
    if (credits === null) {
      setProblem({ field: "units", text: "Enter WPI units, like 1/3 or 1/6." });
      return;
    }
    const result = getDegreeSource().addCourse(placed({ ...typedCourse(clean), title: title.trim(), credits, apIb: program !== undefined, creditSource: source }));
    if (result === "duplicate") {
      setProblem({ field: "code", text: `${clean} is already in your history.` });
      return;
    }
    if (result === "invalid") {
      setProblem({ field: "form", text: "That course couldn’t be added. Check the code and units." });
      return;
    }
    done([clean], result === "unsaved");
  }

  function addExam() {
    if (!examPlan || examCount === 0) return;
    const courses = examPlan.add.map(placed);
    const result = getDegreeSource().addCourses(courses);
    if (result.status === "invalid") {
      setProblem({ field: "form", text: "That credit couldn’t be added. Try entering the course instead." });
      return;
    }
    done(courses.map((course) => course.code), result.status === "unsaved");
  }

  function undo(codes: string[]) {
    for (const item of codes) getDegreeSource().removeCourse(item);
    setAdded({ codes, text: `${codes.join(", ")} removed.`, undo: false });
  }

  return (
    <DrawerFrame
      title="Add manual credit"
      onClose={close}
      footer={<Button size="md" className="min-h-40" onClick={() => open({ kind: "history", tab: "history" })}>Done</Button>}
    >
      <p className="-mt-12 pb-18 text-8-5 leading-17 text-ink-muted">For AP or IB exam credit, or a WPI course the search can’t find.</p>
      <AddTargetCard target={target} onChange={change} startYear={startYear} current={current} />
      <ChoiceChips label="Where is the credit from?" options={SOURCES} value={source} onChange={pickSource} className="pt-18" />
      {byExam ? (
        <ExamCreditFields program={program} exams={EXAMS.filter((item) => item.program === program)} pick={exam} plan={examPlan} onPick={setExam} onTypeInstead={() => setTyping(true)} />
      ) : (
        <>
          {program && <button type="button" onClick={() => setTyping(false)} className="mt-10 cursor-pointer self-start rounded-badge text-8-5 leading-16 font-570 text-accent hover:underline">Pick my {program} exam instead</button>}
          <div className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-12 pt-18">
            <TextInput label="Course code" hideLabel={false} autoComplete="off" spellCheck={false} placeholder="CS 2102" value={code} aria-invalid={problem?.field === "code" ? true : undefined} hint={problem?.field === "code" && <span role="alert">{problem.text}</span>} onChange={(event) => { setCode(event.target.value); setProblem(null); }} />
            <TextInput label="Course title (optional)" hideLabel={false} autoComplete="off" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="pt-16">
            <UnitsField value={units} problem={problem?.field === "units" ? problem.text : null} onChange={(next) => { setUnits(next); setProblem(null); }} />
          </div>
        </>
      )}
      <Button size="md" className="mt-18 self-start" icon={<Plus aria-hidden />} disabled={byExam && examCount === 0} onClick={byExam ? addExam : addTyped}>
        {byExam && examCount > 1 ? `Add ${examCount} courses` : "Add to history"}
      </Button>
      {problem?.field === "form" && <p role="alert" className="pt-10 text-8-5 leading-16 text-notice-warning-ink">{problem.text}</p>}
      <AddedStatus added={added} onUndo={undo} />
      {program && <Notice tone="warning" title="Check how this credit applies" className="mt-8">Your advisor can confirm where exam credit belongs.</Notice>}
    </DrawerFrame>
  );
}
