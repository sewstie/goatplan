"use client";

import { PlanActions } from "@/components/plans/PlanActions";
import { BarMoreMenu } from "./BarMoreMenu";

export function PlannerBarActions() {
  return (
    <div className="flex items-center gap-6 [&_button:not(dialog_button)]:px-8 [&_button:not(dialog_button)]:text-9">
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
