"use client";

import { useEffect, useState } from "react";
import { loadTerm, type TermFile } from "@/lib/data";
import { usePlanner } from "@/lib/store";

export type TermFileState =
  | { status: "loading"; term: null }
  | { status: "ready"; term: TermFile }
  | { status: "error"; term: null };

const LOADING: TermFileState = { status: "loading", term: null };

/** The latest data for a term, with the planner's live seats when it has that term open, to check saved plans against. */
export function useTermFile(termId: string | null): TermFileState {
  const [result, setResult] = useState<{ termId: string; state: TermFileState } | null>(null);
  const plannerTerm = usePlanner((state) => (state.term?.term.id === termId && state.termStatus === "ready" ? state.term : null));

  useEffect(() => {
    if (!termId || plannerTerm) return;
    let active = true;
    loadTerm(termId).then(
      (term) => active && setResult({ termId, state: { status: "ready", term } }),
      () => active && setResult({ termId, state: { status: "error", term: null } }),
    );
    return () => {
      active = false;
    };
  }, [termId, plannerTerm]);

  if (plannerTerm) return { status: "ready", term: plannerTerm };
  return result && result.termId === termId ? result.state : LOADING;
}
