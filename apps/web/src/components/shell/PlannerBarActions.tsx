"use client";

import { PlanActions } from "@/components/plans/PlanActions";
import { BarMoreMenu } from "./BarMoreMenu";

/** The planner's actions in the top bar. Save stays out in the open at every width. */
export function PlannerBarActions() {
  return (
    <div className="flex items-center gap-6 [&_button]:px-8 [&_button]:text-9">
      <PlanActions
        layout={({ menu, share, exportButton, saveButton }) => (
          <>
            <BarMoreMenu>
              {share}
              {exportButton}
              {menu}
            </BarMoreMenu>
            {saveButton}
          </>
        )}
      />
    </div>
  );
}
