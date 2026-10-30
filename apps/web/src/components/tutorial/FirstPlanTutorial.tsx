"use client";

import { useEffect, useRef, useState } from "react";
import { usePhoneScreen, type PhoneScreen } from "@/components/phone/phoneScreen";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { usePlanner, usePlannerStore } from "@/lib/store";
import { browserStorage, readDraft, readLastTerm, type DraftStorage } from "@/lib/store/draft";
import { advanceGuide, guideContent, guideProgress, professorCourse, type GuideStep, type GuideVisit } from "./tutorialSteps";
import { GuideButtons } from "./GuideButtons";
import { GuidePopover } from "./GuidePopover";
import { GuideTargetOutline } from "./GuideTargetOutline";
import { focusTutorialTarget } from "./focusTutorialTarget";
import { rememberGuideProgress, rememberTutorial, tutorialFinished, type TutorialOutcome } from "./tutorialStorage";
import { VisitBanner } from "./VisitBanner";

/** On a phone each step opens the screen that holds its control. */
const PHONE_SCREENS: Readonly<Record<GuideStep, PhoneScreen>> = {
  term: "schedule",
  courses: "search",
  professor: "course",
  availability: "preferences",
  schedules: "schedule",
};

export function FirstPlanTutorial({ storage }: { storage?: DraftStorage | null }) {
  const planner = usePlannerStore();
  const [visit, setVisit] = useState<GuideVisit | null>(null);
  const [storageFailed, setStorageFailed] = useState(false);
  const [storageWording, setStorageWording] = useState(false);
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
    const finished = tutorialFinished(persistence.current);
    const lastTerm = readLastTerm(persistence.current);
    const restoring = lastTerm !== null && (readDraft(persistence.current, lastTerm)?.courses.length ?? 0) > 0;
    if (!finished && !restoring && !planner.getState().savedPlanId && !planner.getState().courses.length) {
      queueMicrotask(() => { if (!cancelled) setVisit({ step: "term", includesProfessor: true }); });
    }
    void planner.getState().init().then(() => {
      if (!cancelled && planner.getState().courses.length) {
        if (!finished && !rememberTutorial(persistence.current, "dismissed")) setStorageFailed(true);
        setVisit(null);
      } else if (!cancelled && !finished && restoring && !planner.getState().savedPlanId) {
        setVisit({ step: "term", includesProfessor: true });
      }
    });
    return () => { cancelled = true; };
  }, [planner, storage]);

  const step = visit?.step;
  const phone = usePhoneViewport();
  const showPhoneScreen = usePhoneScreen((state) => state.show);
  useEffect(() => {
    if (phone && step && !saved) showPhoneScreen(PHONE_SCREENS[step]);
  }, [phone, step, saved, showPhoneScreen]);
  const content = step ? guideContent(step, preferences, noMatches) : null;
  const targetId = content?.target ?? "tutorial-term";
  useEffect(() => {
    if (step === "schedules" && !saved) finish.current?.focus({ preventScroll: true });
  }, [step, saved]);
  useEffect(() => {
    if (step === "professor" && professor && !saved && selected !== professor) planner.getState().selectCourse(professor);
  }, [step, professor, selected, saved, planner]);
  function dismiss(outcome: TutorialOutcome = "dismissed") {
    if (!rememberTutorial(persistence.current, outcome)) setStorageFailed(true);
    setVisit(null);
    focusTutorialTarget(targetId);
  }
  useEffect(() => {
    if (!visit || saved) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && !event.defaultPrevented) dismiss(); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  });

  if (saved || !visit) return <VisitBanner storageFailed={storageFailed} />;
  const waiting = step === "term" ? !ready : step === "courses" && courses.length === 0;
  const termName = terms.find((item) => item.id === termId)?.name;
  const hint = step === "term" && !ready ? `Wait for ${termName ?? "your term’s"} sections to load.` : content?.hint;
  function move(direction: -1 | 1) {
    if (!rememberGuideProgress(persistence.current) && !storageFailed) {
      setStorageFailed(true);
      setStorageWording(true);
      return;
    }
    setStorageWording(false);
    setVisit(advanceGuide(visit!, direction, (step === "term" && courses.length === 0) || professor !== null));
  }
  function next() {
    if (step !== "schedules") return move(1);
    if (!rememberTutorial(persistence.current, "completed") && !storageFailed) {
      setStorageFailed(true);
      setStorageWording(true);
      return;
    }
    dismiss("completed");
  }
  return <>
    <VisitBanner storageFailed={storageFailed} />
    <GuideTargetOutline targetId={targetId} />
    <GuidePopover step={visit.step} targetId={targetId} title={storageWording ? "Keep planning in this visit" : content!.title} body={storageWording ? "You can continue or skip the guide. Your course and choices stay in the open plan." : content!.body} hint={storageWording ? undefined : hint} progress={guideProgress(visit)} onClose={() => dismiss()}>
      <GuideButtons first={step === "term"} last={step === "schedules"} waiting={waiting} onBack={() => move(-1)} onSkip={() => dismiss()} onNext={next} finishRef={finish} />
    </GuidePopover>
  </>;
}
