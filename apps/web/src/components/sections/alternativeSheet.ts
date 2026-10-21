import { create } from "zustand";

interface AlternativeSheetState {
  /** The course whose same-time choices are open, or null when the sheet is closed. */
  course: string | null;
  open(course: string): void;
  close(): void;
}

export const useAlternativeSheet = create<AlternativeSheetState>()((set) => ({
  course: null,
  open: (course) => set({ course }),
  close: () => set({ course: null }),
}));
