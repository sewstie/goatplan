"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { usePlanner, usePlannerStore } from "@/lib/store";
import { browserStorage, type DraftStorage } from "@/lib/store/draft";
import { TUTORIAL_STEPS } from "./tutorialSteps";
import { TutorialAvailability } from "./TutorialAvailability";
import { TutorialProfessor } from "./TutorialProfessor";
import { TutorialSections } from "./TutorialSections";
import { focusTutorialTarget } from "./focusTutorialTarget";
import { rememberTutorial, tutorialFinished, type TutorialOutcome } from "./tutorialStorage";

export function FirstPlanTutorial({ storage }: { storage?: DraftStorage | null }) {
  const planner = usePlannerStore();
  const [step, setStep] = useState<number | null>(null);
  const [storageFailed, setStorageFailed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const persistence = useRef<DraftStorage | null>(null);
  const termStatus = usePlanner((state) => state.termStatus);
  const term = usePlanner((state) => state.term);
  const hasCourses = usePlanner((state) => state.courses.length > 0);
  const noMatches = usePlanner((state) => state.solveStatus === "done" && state.response?.ok === true && state.response.total === 0 && !state.response.diagnosis?.unsure);
  const ready = termStatus === "ready" && term !== null;
  const saved = usePlanner((state) => state.savedPlanId !== null);

  useEffect(() => {
    let cancelled = false;
    void planner.getState().init().then(() => {
      if (cancelled) return;
      persistence.current = storage === undefined ? browserStorage() : storage;
      if (tutorialFinished(persistence.current)) return;
      if (planner.getState().savedPlanId) return;
      if (planner.getState().courses.length > 0) {
        rememberTutorial(persistence.current, "dismissed");
        return;
      }
      setStep(0);
    });
    return () => { cancelled = true; };
  }, [planner, storage]);

  useEffect(() => { heading.current?.focus(); }, [step]);

  if (saved) return null;
  if (step === null) return storageFailed ? (
    <p role="status" className="mx-14 mt-14 rounded-control border border-warning-line bg-warning-soft p-16 text-12 text-warning-ink">
      This browser couldn’t remember that you closed the guide. It may appear on your next visit.
    </p>
  ) : null;
  const current = TUTORIAL_STEPS[step];
  const last = step === TUTORIAL_STEPS.length - 1;
  const canAdvance = last || current.id === "availability" || (ready && (step === 0 || hasCourses));
  const validation = !ready ? "Choose a term and wait for its courses to load." : "Add at least one course to continue.";

  function focusTarget() {
    focusTutorialTarget(current.target);
  }

  function dismiss(outcome: TutorialOutcome = "dismissed") {
    setStorageFailed(!rememberTutorial(persistence.current, outcome));
    setStep(null);
    focusTarget();
  }

  return (
    <section aria-label="First plan tutorial" className="mx-14 mt-14 rounded-panel border border-accent-line bg-surface p-16">
      <div className="flex items-center justify-between gap-16 pb-8">
        <p className="text-10 font-650 text-accent">Your first plan · Step {step + 1} of {TUTORIAL_STEPS.length}</p>
        <IconButton label="Close tutorial" icon={<X aria-hidden />} onClick={() => dismiss()} />
      </div>
      <div className="flex flex-col justify-between gap-16 wide:flex-row wide:items-center">
        <div className="max-w-630">
          <h2 ref={heading} tabIndex={-1} className="w-fit rounded-badge text-17 font-700">{current.title}</h2>
          <p className="pt-5 text-12 text-ink-soft">{current.description}</p>
          {current.id === "courses" && <TutorialProfessor />}
          {current.id === "availability" && <TutorialAvailability />}
          {current.id === "schedules" && noMatches && <p role="status" className="pt-8 text-12 text-warning-ink">No schedule fits your current choices. Your restrictions are still in place. Use the explanation below and change a setting when you’re ready.</p>}
          {current.id === "schedules" && <TutorialSections />}
          {!canAdvance && <p id="tutorial-validation" role="status" className="pt-5 text-11 text-ink-muted">{validation}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-8">
          <Button variant="soft" onClick={focusTarget}>{current.action}</Button>
          <Button variant="secondary" onClick={() => dismiss()}>Skip tutorial</Button>
          <Button variant="secondary" className="disabled:opacity-45" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
          <Button disabled={!canAdvance} aria-describedby={!canAdvance ? "tutorial-validation" : undefined} onClick={() => last ? dismiss("completed") : setStep(step + 1)}>{last ? "Finish tutorial" : "Next"}</Button>
        </div>
      </div>
    </section>
  );
}
