"use client";

import type { ChangeEvent } from "react";
import { describeBadFile, MAX_HISTORY_FILE_LENGTH, parseHistoryFile, previewImport, type DegreeHistory } from "@/lib/degree";
import { useDegreeUi } from "./degreeUi";
import { DEFAULT_SHEET_ID, loadSheet } from "@/lib/degree/sheets";

export function useHistoryFile(history: DegreeHistory) {
  const open = useDegreeUi((state) => state.open);
  return async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    let text = "";
    if (file.size <= MAX_HISTORY_FILE_LENGTH) {
      try {
        text = await file.text();
      } catch {
        // An unreadable file gets the same message as a broken one.
      }
    }
    const parsed = parseHistoryFile(text);
    if (parsed.ok) {
      try {
        const sheet = await loadSheet(parsed.history.sheetId ?? DEFAULT_SHEET_ID);
        open({ kind: "importReview", preview: previewImport(parsed.history, file.name, history, sheet) });
      } catch {
        useDegreeUi.getState().set({ toast: { message: "This major’s sheet isn’t available. Your history is unchanged." } });
      }
    } else open({ kind: "importError", fileName: file.name, problem: describeBadFile(text), version: parsed.reason === "version" });
  };
}
