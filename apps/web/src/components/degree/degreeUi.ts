"use client";

import { create } from "zustand";
import type { DegreeHistory, ImportPreview, LinePin, MoveOutcome, FileProblem, SheetFilter } from "@/lib/degree";

export type HistoryTab = "history" | "search" | "several";

export type Panel =
  | { kind: "options"; code: string }
  | { kind: "move"; code: string }
  | { kind: "fill"; line: number }
  | { kind: "menu" }
  | { kind: "checks" }
  | { kind: "details"; code: string }
  | { kind: "history"; tab: HistoryTab }
  | { kind: "manual"; code?: string }
  | { kind: "transfer" }
  | { kind: "importReview"; preview: ImportPreview }
  | { kind: "importPins"; preview: ImportPreview }
  | { kind: "importError"; fileName: string; problem: FileProblem; version: boolean }
  | { kind: "removed"; code: string; previous: DegreeHistory };

export interface KeepPinAsk {
  pin: LinePin;
  outcome: MoveOutcome;
}

export interface RestoredPins {
  rejected: LinePin[];
  kept: LinePin[];
  /** Where a rejected course sits now. */
  fileName: string;
}

export interface DegreeToast {
  message: string;
  undo?: DegreeHistory;
}

interface DegreeUi {
  panel: Panel | null;
  view: "sheet" | "list";
  screen: "main" | "how" | "confirmations";
  filter: SheetFilter | null;
  selectedTerm: string | null;
  whatIf: { perTerm: number; summer: boolean; bsMs: boolean };
  keepPin: KeepPinAsk | null;
  restored: RestoredPins | null;
  toast: DegreeToast | null;
  open(panel: Panel): void;
  close(): void;
  set(changes: Partial<Omit<DegreeUi, "open" | "close" | "set">>): void;
}

export const DEFAULT_PACE = 3;

export const useDegreeUi = create<DegreeUi>((set) => ({
  panel: null,
  view: "sheet",
  screen: "main",
  filter: null,
  selectedTerm: null,
  whatIf: { perTerm: DEFAULT_PACE, summer: false, bsMs: false },
  keepPin: null,
  restored: null,
  toast: null,
  open: (panel) => set({ panel }),
  close: () => set({ panel: null }),
  set: (changes) => set(changes),
}));
