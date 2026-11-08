"use client";

import { AddPlanToDegree } from "@/components/degree/AddPlanToDegree";
import { BarMoreMenu } from "./BarMoreMenu";
import { PlanActions } from "@/components/plans/PlanActions";

export function PlannerBarActions() {
  return (
    <div className="flex items-center gap-6 [&_button:not(dialog_button):not([role=dialog]_button)]:px-8 [&_button:not(dialog_button):not([role=dialog]_button)]:text-9">
      <PlanActions
        layout={({ menu, share, exportButton, saveButton }) => (
          <>
            {menu}
            {share}
            {exportButton}
            {saveButton}
            <BarMoreMenu><AddPlanToDegree /></BarMoreMenu>
          </>
        )}
      />
    </div>
  );
}
