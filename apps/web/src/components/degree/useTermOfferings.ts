"use client";

import { useEffect, useMemo, useState } from "react";
import { loadTerm, loadTermIndex } from "@/lib/data/load";
import type { TermFile } from "@/lib/data/types";
import { offeredCodes, termOffers, type OfferedCodes, type TermOffers } from "@/lib/degree/termOfferings";

const NO_FILES: TermFile[] = [];
let loading: Promise<TermFile[]> | null = null;

function loadFiles(): Promise<TermFile[]> {
  loading ??= loadTermIndex()
    .then(({ terms }) => Promise.allSettled(terms.map((term) => loadTerm(term.id))))
    .then((files) => {
      if (files.some((file) => file.status === "rejected")) loading = null;
      return files.flatMap((file) => (file.status === "fulfilled" ? [file.value] : []));
    })
    .catch(() => {
      loading = null;
      return NO_FILES;
    });
  return loading;
}

export function useTermFiles(): { files: readonly TermFile[]; ready: boolean } {
  const [state, setState] = useState<{ files: readonly TermFile[]; ready: boolean }>({ files: NO_FILES, ready: false });
  useEffect(() => {
    let live = true;
    void loadFiles().then((files) => { if (live) setState({ files, ready: true }); });
    return () => { live = false; };
  }, []);
  return state;
}

export function useOfferedCodes(): { codes: OfferedCodes; ready: boolean } {
  const { files, ready } = useTermFiles();
  const codes = useMemo(() => offeredCodes(files), [files]);
  return { codes, ready };
}

export function useTermOffers(code: string | null): TermOffers | undefined {
  const { codes } = useOfferedCodes();
  return useMemo(() => (code && codes.size > 0 ? termOffers(code, codes) : undefined), [code, codes]);
}
