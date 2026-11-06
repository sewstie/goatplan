"use client";

import { useCallback, useEffect, useState } from "react";
import { loadTermIndex } from "@/lib/data/load";
import type { TermSummary } from "@/lib/data/types";

export function usePublishedTerms() {
  const [terms, setTerms] = useState<TermSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => { setStatus("loading"); setAttempt((value) => value + 1); }, []);
  useEffect(() => {
    let live = true;
    void loadTermIndex().then((index) => {
      if (live) { setTerms(index.terms); setStatus("ready"); }
    }).catch(() => { if (live) setStatus("failed"); });
    return () => { live = false; };
  }, [attempt]);
  return { terms, status, retry };
}
