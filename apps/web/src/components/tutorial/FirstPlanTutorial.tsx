"use client";

import { useEffect, useRef, useState } from "react";
import { usePlanner, usePlannerStore } from "@/lib/store";
import { browserStorage, type DraftStorage } from "@/lib/store/draft";
import { advanceGuide, guideContent, guideProgress, professorCourse, type GuideVisit } from "./tutorialSteps";
import { GuideButtons } from "./GuideButtons";
import { GuidePopover } from "./GuidePopover";
import { GuideTargetOutline } from "./GuideTargetOutline";
import { focusTutorialTarget } from "./focusTutorialTarget";
import { rememberTutorial, tutorialFinished, type TutorialOutcome } from "./tutorialStorage";

export function FirstPlanTutorial({ storage }: { storage?: DraftStorage | null }) {
  const planner = usePlannerStore();
  const [visit, setVisit] = useState<GuideVisit | null>(null);
  const [storageFailed, setStorageFailed] = useState(false);
  const persistence = useRef<DraftStorage | null>(null);
  const finish = useRef<HTMLButtonElement>(null);
  const termStatus = usePlanner((state) => state.termStatus);
  const term = usePlanner((state) => state.term);
  const terms = usePlanner((state) => state.terms);
  const termId = usePlanner((state) => state.termId);
  const courses = usePlanner((state) => state.courses);
  const selected = usePlanner((state) => state.selectedCourse);
  const preferences = usePlanner((state) => state.preferences);
  const professor = professorCourse(term, courses, selected);
  const noMatches = usePlanner((state) => state.solveStatus === "done" && state.response?.ok === true && state.response.total === 0);
  const saved = usePlanner((state) => state.savedPlanId !== null);
  const ready = termStatus === "ready" && term !== null;

  useEffect(() => {
    persistence.current = storage === undefined ? browserStorage() : storage;
    let cancelled = false;
    if (!tutorialFinished(persistence.current) && !planner.getState().savedPlanId && !planner.getState().courses.length) {
      queueMicrotask(() => { if (!cancelled) setVisit({ step: "term", includesProfessor: true }); });
    }
    void planner.getState().init().then(() => {
      if (!cancelled && planner.getState().courses.length) {
        rememberTutorial(persistence.current, "dismissed");
        setVisit(null);
      }
    });
    return () => { cancelled = true; };
  }, [planner, storage]);

  const step = visit?.step;
  const content = step ? guideContent(step, preferences, noMatches) : null;
  const targetId = content?.target ?? "tutorial-term";
  useEffect(() => {
    if (step === "schedules" && !saved) finish.current?.focus({ preventScroll: true });
  }, [step, saved]);
  useEffect(() => {
    if (step === "professor" && professor && !saved && selected !== professor) planner.getState().selectCourse(professor);
  }, [step, professor, selected, saved, planner]);
  function dismiss(outcome: TutorialOutcome = "dismissed") {
    setStorageFailed(!rememberTutorial(persistence.current, outcome));
    setVisit(null);
    focusTutorialTarget(targetId);
  }
  useEffect(() => {
    if (!visit || saved) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") dismiss(); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  });

  if (saved) return null;
  if (!visit) return storageFailed ? <p role="status" className="mx-14 mt-14 rounded-control border border-warning-line bg-warning-soft p-16 text-12 text-warning-ink">This browser couldn’t remember that you closed the guide. It may appear on your next visit.</p> : null;
  const waiting = step === "term" ? !ready : step === "courses" && courses.length === 0;
  const termName = terms.find((item) => item.id === termId)?.name;
  const hint = step === "term" && !ready ? `Wait for ${termName ?? "your term’s"} sections to load.` : content?.hint;
  function move(direction: -1 | 1) {
    setVisit(advanceGuide(visit!, direction, (step === "term" && courses.length === 0) || professor !== null));
  }
  return <>
    <GuideTargetOutline targetId={targetId} />
    <GuidePopover step={visit.step} targetId={targetId} title={content!.title} body={content!.body} hint={hint} progress={guideProgress(visit)} onClose={() => dismiss()}>
      <GuideButtons first={step === "term"} last={step === "schedules"} waiting={waiting} onBack={() => move(-1)} onSkip={() => dismiss()} onNext={() => step === "schedules" ? dismiss("completed") : move(1)} finishRef={finish} />
    </GuidePopover>
  </>;
}
