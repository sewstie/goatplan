"use client";

import { useState } from "react";
import { DegreeTabs, type DegreeTab } from "./DegreeTabs";
import { PlanAhead } from "./PlanAhead";
import { SuggestCoursesPanel } from "./SuggestCoursesPanel";
import { DegreeCourseMap } from "./DegreeCourseMap";
import { useDegree } from "@/lib/degree";
import { DegreePanels } from "./DegreePanels";
import { DegreeTitle } from "./DegreeTitle";
import { DegreeToastBar } from "./DegreeToastBar";
import { DegreeMain } from "./DegreeMain";
import { KeepPinDialog } from "./KeepPinDialog";
import { StorageBlockedDialog } from "./StorageBlockedDialog";
import { useDegreeView } from "./useDegreeView";
import { MajorPicker } from "./MajorPicker";

export function DegreeContent() {
  const degree = useDegree();
  const view = useDegreeView(degree);
  const [selectedTab, setTab] = useState<DegreeTab>("sheet");
  const tab = selectedTab === "map" && degree?.selectedSheetId !== "cs-2030" ? "sheet" : selectedTab;

  if (!degree) return null;
  if (degree.selectedSheetId === null) return <MajorPicker selected={null} />;

  return (
    <>
      <div className="flex flex-col gap-18 tablet:gap-12">
          <DegreeTitle hasCourses={degree.history.courses.length > 0} selectedSheetId={degree.selectedSheetId}  />
          <DegreeTabs value={tab} onChange={setTab} mapAvailable={degree.selectedSheetId === "cs-2030"} />
          {tab === "sheet" && <DegreeMain degree={degree} view={view} />}
          {tab === "plan" && <PlanAhead degree={degree} view={view} />}
          {tab === "suggestions" && <SuggestCoursesPanel history={degree.history} inline />}
          {tab === "map" && <DegreeCourseMap history={degree.history} />}
      </div>
      <DegreePanels degree={degree} view={view} />
      <KeepPinDialog />
      <StorageBlockedDialog degree={degree} />
      <DegreeToastBar />
    </>
  );
}
