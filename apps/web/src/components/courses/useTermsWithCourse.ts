"use client";

import { useEffect, useState } from "react";
import { loadTerm } from "@/lib/data";
import type { TermSummary } from "@/lib/data/types";
import { usePlanner } from "@/lib/store";
import { termsWithCourse } from "./otherTerms";

type Lookup = { key: string; terms: TermSummary[] };

/**
 * The other open terms that list `code`, or null while it's still looking (or when `code` is null).
 * Other terms' files are downloaded only for a full course code that the current term doesn't have.
 */
export function useTermsWithCourse(code: string | null): TermSummary[] | null {
  const terms = usePlanner((state) => state.terms);
  const termId = usePlanner((state) => state.termId);
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const key = code === null ? null : `${termId}:${code}`;

  useEffect(() => {
    if (code === null || key === null) return;
    let current = true;
    void termsWithCourse(code, terms, termId, loadTerm).then((found) => {
      if (current) setLookup({ key, terms: found });
    });
    return () => {
      current = false;
    };
  }, [code, key, terms, termId]);

  return key !== null && lookup?.key === key ? lookup.terms : null;
}
