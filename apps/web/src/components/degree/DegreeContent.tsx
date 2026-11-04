"use client";

import { useEffect } from "react";
import { getDegreeSource, useDegree } from "@/lib/degree";
import { usePlanner } from "@/lib/store";
import { DegreePanels } from "./DegreePanels";
import { DegreeTitle } from "./DegreeTitle";
import { DegreeToastBar } from "./DegreeToastBar";
import { DegreeMain } from "./DegreeMain";
import { HowCoursesCount } from "./HowCoursesCount";
import { KeepPinDialog } from "./KeepPinDialog";
import { RestoredPinDialog } from "./RestoredPinDialog";
import { StorageBlockedDialog } from "./StorageBlockedDialog";
import { useDegreeUi } from "./degreeUi";
import { useDegreeView } from "./useDegreeView";
import { YourConfirmations } from "./YourConfirmations";

export function DegreeContent() {
  const degree = useDegree();
  const view = useDegreeView(degree);
  const screen = useDegreeUi((state) => state.screen);
  const termId = usePlanner((state) => state.termId);
  const planned = usePlanner((state) => state.courses);

  useEffect(() => {
    if (termId) getDegreeSource().planChanged();
  }, [termId, planned]);

  if (!degree) return null;

  return (
    <>
      {screen === "how" && <HowCoursesCount history={degree.history} view={view} planCourses={degree.planCourses} />}
      {screen === "confirmations" && <YourConfirmations history={degree.history} />}
      {screen === "main" && (
        <div className="flex flex-col gap-18 tablet:gap-12">
          <DegreeTitle hasCourses={degree.history.courses.length > 0} />
          <DegreeMain degree={degree} view={view} />
        </div>
      )}
      <DegreePanels degree={degree} view={view} />
      <KeepPinDialog />
      <RestoredPinDialog />
      <StorageBlockedDialog degree={degree} />
      <DegreeToastBar />
    </>
  );
}
