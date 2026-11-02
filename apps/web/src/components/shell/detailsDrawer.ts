"use client";

import { create } from "zustand";

interface DetailsDrawer {
  open: boolean;
  docked: boolean;
  takeFocus: boolean;
  show(takeFocus?: boolean): void;
  hide(): void;
  setDocked(docked: boolean): void;
}

export const useDetailsDrawer = create<DetailsDrawer>((set) => ({
  open: false,
  docked: false,
  takeFocus: true,
  show: (takeFocus = true) => set({ open: true, takeFocus }),
  hide: () => set({ open: false }),
  setDocked: (docked) => set({ docked }),
}));
