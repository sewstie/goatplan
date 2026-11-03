"use client";

import { useEffect, useRef, useState } from "react";
import { usePhoneScreen, type PhoneScreen } from "@/components/phone/phoneScreen";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { usePlanner, usePlannerStore } from "@/lib/store";
import { browserStorage, readDraft, readLastTerm, type DraftStorage } from "@/lib/store/draft";
import { shareData } from "@/lib/share/url";
import { advanceGuide, guideContent, guideProgress, professorCourse, type GuideStep, type GuideVisit } from "./tutorialSteps";
import { GuideButtons } from "./GuideButtons";
import { GuidePopover } from "./GuidePopover";
import { GuideTargetOutline } from "./GuideTargetOutline";
import { focusTutorialTarget } from "./focusTutorialTarget";
import { useGuideSession } from "./guideSession";
import { rememberGuideProgress, rememberTutorial, tutorialFinished, tutorialStarted } from "./tutorialStorage";
import { VisitBanner } from "./VisitBanner";

/** On a phone each step opens the screen that holds its control. */
const PHONE_SCREENS: Readonly<Record<GuideStep, PhoneScreen>> = {
  term: "schedule",
  courses: "search",
  professor: "course",
  availability: "schedule",
  schedules: "schedule",
};

export function FirstPlanTutorial({ storage }: { storage?: DraftStorage | null }) {
  const planner = usePlannerStore();
  const [visit, setVisit] = useState<GuideVisit | null>(null);
  const [storageFailed, setStorageFailed] = useState(false);
  const [storageWording, setStorageWording] = useState(false);
  const [run, setRun] = useState(0);
  const replaying = useRef(false);
  const persistence = useRef<DraftStorage | null>(null);
  const finish = useRef<HTMLButtonElement>(null);
  const termStatus = usePlanner((state) => state.termStatus);
  const term = usePlanner((state) => state.term);
  const terms = usePlanner((state) => state.terms);
  const termId = usePlanner((state) => state.termId);
  const courses = usePlanner((state) => state.courses);
  const selected = usePlanner((state) => state.selectedCourse);
  const professor = professorCourse(term, courses, selected);
  const noMatches = usePlanner((state) => state.solveStatus === "done" && state.response?.ok === true && state.response.total === 0 && !state.response.diagnosis?.unsure);
  const saved = usePlanner((state) => state.savedPlanId !== null);
  const ready = termStatus === "ready" && term !== null;

  useEffect(() => {
    persistence.current = storage === undefined ? browserStorage() : storage;
    if (shareData(window.location.hash) !== null) return;
    let cancelled = false;
    const finished = tutorialFinished(persistence.current);
    const started = tutorialStarted(persistence.current);
    const closed = useGuideSession.getState().closedThisVisit;
    const lastTerm = readLastTerm(persistence.current);
    const restoring = lastTerm !== null && (readDraft(persistence.current, lastTerm)?.courses.length ?? 0) > 0;
    if (!finished && !closed && !restoring && !planner.getState().savedPlanId && !planner.getState().courses.length) {
      queueMicrotask(() => { if (!cancelled) setVisit({ step: "term", includesProfessor: true }); });
    }
    void planner.getState().init().then(() => {
      if (cancelled || replaying.current || finished) return;
      const { courses: restored, savedPlanId } = planner.getState();
      // A plan from before the guide existed, or made without ever opening it: no need to teach this student.
      if (restored.length > 0 && !started) {
        if (!rememberTutorial(persistence.current, "dismissed")) setStorageFailed(true);
        setVisit(null);
      } else if (!closed && (restoring || restored.length > 0) && !savedPlanId) {
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
  const replayRequested = useGuideSession((state) => state.replayRequested);
  const includesProfessor = courses.length === 0 || professor !== null;
  useEffect(() => {
    if (!replayRequested) return;
    replaying.current = true;
    useGuideSession.getState().replayStarted();
    planner.getState().showFound();
    if (phone) showPhoneScreen(PHONE_SCREENS.term);
    queueMicrotask(() => {
      setStorageWording(false);
      setRun((count) => count + 1);
      setVisit({ step: "term", includesProfessor });
    });
  }, [replayRequested, planner, phone, showPhoneScreen, includesProfessor]);
  const content = step ? guideContent(step, { hasCourses: courses.length > 0, noMatches, phone }) : null;
  const targetId = content?.target ?? "tutorial-term";
  useEffect(() => {
    if (step === "professor" && professor && !saved && selected !== professor) planner.getState().selectCourse(professor);
  }, [step, professor, selected, saved, planner]);
  function close() {
    if (!rememberGuideProgress(persistence.current)) setStorageFailed(true);
    useGuideSession.getState().closeForVisit();
    setVisit(null);
    focusTutorialTarget(targetId);
  }
  function skip() {
    if (!rememberTutorial(persistence.current, "dismissed")) setStorageFailed(true);
    useGuideSession.getState().showSkipped();
    close();
  }
  useEffect(() => {
    if (!visit || saved) return;
    // Escape in drawing mode or a dialog only leaves that.
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !event.defaultPrevented && !planner.getState().drawing && !document.querySelector("dialog[open]")) close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
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
    if (step === "availability") planner.getState().setDrawing(false);
    setVisit(advanceGuide(visit!, direction, (step === "term" && courses.length === 0) || professor !== null));
  }
  function next() {
    if (step !== "schedules") return move(1);
    if (!rememberTutorial(persistence.current, "completed") && !storageFailed) {
      setStorageFailed(true);
      setStorageWording(true);
      return;
    }
    close();
  }
  return <>
    <VisitBanner storageFailed={storageFailed} />
    <GuideTargetOutline targetId={targetId} />
    <GuidePopover key={run} step={visit.step} targetId={targetId} finishRef={finish} title={storageWording ? "Can’t save in this browser" : content!.title} body={storageWording ? "Your choices last until you close this tab." : content!.body} hint={storageWording ? undefined : hint} progress={guideProgress(visit)} onClose={close}>
      <GuideButtons first={step === "term"} last={step === "schedules"} waiting={waiting} onBack={() => move(-1)} onSkip={skip} onNext={next} finishRef={finish} />
    </GuidePopover>
  </>;
}
