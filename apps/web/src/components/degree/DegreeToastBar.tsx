"use client";

import { Toast } from "@/components/ui/Toast";
import { undoTo } from "./degreeActions";
import { useDegreeUi } from "./degreeUi";

export function DegreeToastBar() {
  const toast = useDegreeUi((state) => state.toast);
  const set = useDegreeUi((state) => state.set);
  const undo = toast?.undo;
  return (
    <Toast
      dark
      message={toast?.message ?? null}
      actions={undo ? [{ label: "Undo", onAction: () => { undoTo(undo); set({ toast: null }); } }] : []}
      onDismiss={() => set({ toast: null })}
    />
  );
}
