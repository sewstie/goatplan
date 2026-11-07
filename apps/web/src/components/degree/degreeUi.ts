"use client";

import { create } from "zustand";
import { DEFAULT_SEMESTER_LOAD, type DegreeHistory, type LinePin, type MoveOutcome, type SheetFilter } from "@/lib/degree";

export type HistoryTab = "history" | "search";

export type Panel =
  | { kind: "suggest"; line?: number }
  | { kind: "options"; code: string }
  | { kind: "move"; code: string }
  | { kind: "fill"; line: number }
  | { kind: "checks" }
  | { kind: "details"; code: string }
  | { kind: "history"; tab: HistoryTab }
  | { kind: "manual"; code?: string }
  | { kind: "removed"; code: string; previous: DegreeHistory };

export interface KeepPinAsk {
  pin: LinePin;
  outcome: MoveOutcome;
}

export interface DegreeToast {
  message: string;
  undo?: DegreeHistory;
}

interface DegreeUi {
  panel: Panel | null;
  view: "sheet" | "list";
  filter: SheetFilter | null;
  selectedTerm: string | null;
  addingTerm: string | null;
  lastAddTerm: string | null;
  whatIf: { perSemester: number; summer: boolean };
  keepPin: KeepPinAsk | null;
  toast: DegreeToast | null;
  open(panel: Panel): void;
  close(): void;
  set(changes: Partial<Omit<DegreeUi, "open" | "close" | "set">>): void;
}


export const useDegreeUi = create<DegreeUi>((set) => ({
  panel: null,
  view: "sheet",
  filter: null,
  selectedTerm: null,
  addingTerm: null,
  lastAddTerm: null,
  whatIf: { perSemester: DEFAULT_SEMESTER_LOAD, summer: false },
  keepPin: null,
  toast: null,
  open: (panel) => set({ panel }),
  close: () => set({ panel: null, addingTerm: null }),
  set: (changes) => set(changes),
}));
