"use client";

import { useMemo } from "react";
import { parseTerm, termAt, type TermName } from "@/lib/degree";
import { usePublishedTerms } from "./usePublishedTerms";

export function useCurrentTerm(): TermName {
  const published = usePublishedTerms();
  const id = published.terms.find((term) => term.status === "in-progress")?.id;
  return useMemo(() => parseTerm(id) ?? termAt(new Date()), [id]);
}
