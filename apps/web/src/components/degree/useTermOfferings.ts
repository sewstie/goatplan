"use client";

import { useEffect, useMemo, useState } from "react";
import { loadTerm, loadTermIndex } from "@/lib/data/load";
import { offeredCodes, termOffers, type OfferedCodes, type TermOffers } from "@/lib/degree/termOfferings";

const NONE: OfferedCodes = new Map();
let loading: Promise<OfferedCodes> | null = null;

function loadOffered(): Promise<OfferedCodes> {
  loading ??= loadTermIndex()
    .then(({ terms }) => Promise.allSettled(terms.map((term) => loadTerm(term.id))))
    .then((files) => {
      if (files.some((file) => file.status === "rejected")) loading = null;
      return offeredCodes(files.flatMap((file) => (file.status === "fulfilled" ? [file.value] : [])));
    })
    .catch(() => {
      loading = null;
      return NONE;
    });
  return loading;
}

export function useOfferedCodes(): { codes: OfferedCodes; ready: boolean } {
  const [state, setState] = useState<{ codes: OfferedCodes; ready: boolean }>({ codes: NONE, ready: false });
  useEffect(() => {
    let live = true;
    void loadOffered().then((codes) => { if (live) setState({ codes, ready: true }); });
    return () => { live = false; };
  }, []);
  return state;
}

export function useTermOffers(code: string | null): TermOffers | undefined {
  const { codes } = useOfferedCodes();
  return useMemo(() => (code && codes.size > 0 ? termOffers(code, codes) : undefined), [code, codes]);
}
