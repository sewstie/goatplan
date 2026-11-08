import type { DragEvent } from "react";
import { fitsLine, type DegreeHistory } from "@/lib/degree";
import { requestMove } from "./degreeActions";
import type { DegreeView } from "./useDegreeView";

export const DRAG_TYPE = "application/x-goatplan-course";

export function lineDropProps(view: DegreeView, history: DegreeHistory, line: number, current: string | null = null) {
  const allowed = (code: string) => {
    const credits = view.courses.get(code)?.credits;
    return credits !== undefined && code !== current && fitsLine(code, credits, line);
  };
  return {
    onDragOver(event: DragEvent) {
      if (event.dataTransfer.types.includes(DRAG_TYPE)) event.preventDefault();
    },
    onDrop(event: DragEvent) {
      const code = event.dataTransfer.getData(DRAG_TYPE);
      if (code && allowed(code)) {
        event.preventDefault();
        requestMove(view, history, { code, line });
      }
    },
  };
}
