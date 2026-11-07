"use client";

import { useState } from "react";
import { parseTerm, termLong } from "@/lib/degree";
import { defaultAddTerm, stateForTerm } from "@/lib/degree/planGrid";
import { useDegreeUi } from "./degreeUi";
import type { TermAndState } from "./TermStatusFields";
import { useCurrentTerm } from "./useCurrentTerm";
import { usePlanStart } from "./usePlanStart";

export function useAddTarget() {
  const current = useCurrentTerm();
  const startYear = usePlanStart();
  const [target, setTarget] = useState<TermAndState>(() => {
    const ui = useDegreeUi.getState();
    const term = ui.addingTerm ?? ui.lastAddTerm ?? termLong(defaultAddTerm(startYear, current));
    return { term, state: stateForTerm(parseTerm(term), current) };
  });

  function change(next: TermAndState) {
    setTarget(next);
    useDegreeUi.getState().set({ lastAddTerm: next.term || null, addingTerm: null });
  }

  return { target, change, current, startYear };
}
