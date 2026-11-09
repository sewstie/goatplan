"use client";

import { AddToDegreeButton } from "@/components/degree/AddToDegreeButton";
import { PlanActions } from "@/components/plans/PlanActions";
import { usePlanner } from "@/lib/store";

export function PlannerBarActions() {
  const temporary = usePlanner((state) => state.temporaryPlan !== null);
  return (
    <div className="flex items-center gap-6 [&_button:not(dialog_button):not([role=dialog]_button)]:px-8 [&_button:not(dialog_button):not([role=dialog]_button)]:text-9">
      <PlanActions
        layout={({ menu, share, exportButton, saveButton }) => (
          <>
            {menu}
            {share}
            {exportButton}
            {!temporary && <AddToDegreeButton />}
            {saveButton}
          </>
        )}
      />
    </div>
  );
}
