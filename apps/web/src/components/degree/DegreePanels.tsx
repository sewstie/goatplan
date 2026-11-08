"use client";

import { Drawer } from "@/components/ui/Drawer";
import type { DegreeSnapshot } from "@/lib/degree";
import { SuggestCoursesPanel } from "./SuggestCoursesPanel";
import { ChecksPanel } from "./ChecksPanel";
import { CourseDetailsPanel } from "./CourseDetailsPanel";
import { CourseOptionsPanel } from "./CourseOptionsPanel";
import { FillLinePanel } from "./FillLinePanel";
import { HistoryPanel } from "./HistoryPanel";
import { ManualCoursePanel } from "./ManualCoursePanel";
import { MoveLinePanel } from "./MoveLinePanel";
import { RemovedPanel } from "./RemovedPanel";
import { useDegreeUi } from "./degreeUi";
import type { DegreeView } from "./useDegreeView";

export function DegreePanels({ degree, view }: { degree: DegreeSnapshot; view: DegreeView | null }) {
  const panel = useDegreeUi((state) => state.panel);
  const close = useDegreeUi((state) => state.close);
  return (
    <Drawer open={panel !== null} onClose={close}>
      {panel?.kind === "suggest" && <SuggestCoursesPanel history={degree.history} line={panel.line} />}
      {panel?.kind === "checks" && view && <ChecksPanel view={view} history={degree.history} />}
      {panel?.kind === "options" && view && <CourseOptionsPanel code={panel.code} view={view} />}
      {panel?.kind === "move" && view && <MoveLinePanel code={panel.code} view={view} history={degree.history} />}
      {panel?.kind === "fill" && view && <FillLinePanel line={panel.line} view={view} history={degree.history} />}
      {panel?.kind === "details" && <CourseDetailsPanel code={panel.code} history={degree.history} view={view} />}
      {panel?.kind === "history" && <HistoryPanel tab={panel.tab} degree={degree} />}
      {panel?.kind === "manual" && <ManualCoursePanel history={degree.history} initialCode={panel.code} />}
      {panel?.kind === "removed" && <RemovedPanel code={panel.code} previous={panel.previous} />}
    </Drawer>
  );
}
