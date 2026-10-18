"use client";

import { useEffect, useState } from "react";
import { loadTerm, type TermFile } from "@/lib/data";

export type TermFileState =
  | { status: "loading"; term: null }
  | { status: "ready"; term: TermFile }
  | { status: "error"; term: null };

const LOADING: TermFileState = { status: "loading", term: null };

/** The latest data for a term (downloaded once and shared with the planner), to check saved plans against. */
export function useTermFile(termId: string | null): TermFileState {
  const [result, setResult] = useState<{ termId: string; state: TermFileState } | null>(null);

  useEffect(() => {
    if (!termId) return;
    let active = true;
    loadTerm(termId).then(
      (term) => active && setResult({ termId, state: { status: "ready", term } }),
      () => active && setResult({ termId, state: { status: "error", term: null } }),
    );
    return () => {
      active = false;
    };
  }, [termId]);

  return result && result.termId === termId ? result.state : LOADING;
}
