"use client";

import { Drawer } from "@/components/ui/Drawer";
import type { DegreeSnapshot } from "@/lib/degree";
import { ChecksPanel } from "./ChecksPanel";
import { CourseDetailsPanel } from "./CourseDetailsPanel";
import { CourseOptionsPanel } from "./CourseOptionsPanel";
import { FillLinePanel } from "./FillLinePanel";
import { HistoryPanel } from "./HistoryPanel";
import { ImportErrorPanel } from "./ImportErrorPanel";
import { ImportPinsPanel } from "./ImportPinsPanel";
import { ImportReviewPanel } from "./ImportReviewPanel";
import { ManualCoursePanel } from "./ManualCoursePanel";
import { MoveLinePanel } from "./MoveLinePanel";
import { RemovedPanel } from "./RemovedPanel";
import { SheetMenuPanel } from "./SheetMenuPanel";
import { TransferPanel } from "./TransferPanel";
import { useDegreeUi } from "./degreeUi";
import type { DegreeView } from "./useDegreeView";

export function DegreePanels({ degree, view }: { degree: DegreeSnapshot; view: DegreeView | null }) {
  const panel = useDegreeUi((state) => state.panel);
  const close = useDegreeUi((state) => state.close);
  return (
    <Drawer open={panel !== null} onClose={close}>
      {panel?.kind === "menu" && <SheetMenuPanel view={view} sheetReady={degree.sheet !== null} />}
      {panel?.kind === "checks" && view && <ChecksPanel view={view} history={degree.history} />}
      {panel?.kind === "options" && view && <CourseOptionsPanel code={panel.code} view={view} />}
      {panel?.kind === "move" && view && <MoveLinePanel code={panel.code} view={view} history={degree.history} />}
      {panel?.kind === "fill" && view && <FillLinePanel line={panel.line} view={view} history={degree.history} />}
      {panel?.kind === "details" && <CourseDetailsPanel code={panel.code} history={degree.history} view={view} />}
      {panel?.kind === "history" && <HistoryPanel tab={panel.tab} degree={degree} view={view} />}
      {panel?.kind === "manual" && <ManualCoursePanel initialCode={panel.code} />}
      {panel?.kind === "transfer" && <TransferPanel history={degree.history} sheetReady={degree.sheet !== null} />}
      {panel?.kind === "importReview" && <ImportReviewPanel preview={panel.preview} />}
      {panel?.kind === "importPins" && <ImportPinsPanel preview={panel.preview} />}
      {panel?.kind === "importError" && <ImportErrorPanel fileName={panel.fileName} problem={panel.problem} version={panel.version} history={degree.history} />}
      {panel?.kind === "removed" && <RemovedPanel code={panel.code} previous={panel.previous} />}
    </Drawer>
  );
}
