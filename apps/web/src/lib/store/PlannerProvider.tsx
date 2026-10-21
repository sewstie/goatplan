"use client";

import { createContext, type ReactNode } from "react";
import type { StoreApi } from "zustand/vanilla";
import type { PlannerStore } from "./types";

export const PlannerContext = createContext<StoreApi<PlannerStore> | null>(null);

export function PlannerProvider({ store, children }: { store: StoreApi<PlannerStore>; children: ReactNode }) {
  return <PlannerContext value={store}>{children}</PlannerContext>;
}
