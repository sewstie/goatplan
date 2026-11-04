import { getDegreeSource, moveOutcome, sectionNameOfLine, type DegreeHistory, type LinePin } from "@/lib/degree";
import { useDegreeUi } from "./degreeUi";
import type { DegreeView } from "./useDegreeView";

const SHORT_SECTIONS: Record<string, string> = {
  "Computer science": "CS",
  Mathematics: "Math",
  "Humanities & arts": "HUA",
  "Science & engineering": "Science",
  "Social science": "Social science",
  "Free electives": "Free elective",
};

export const shortLine = (line: number) => `${SHORT_SECTIONS[sectionNameOfLine(line)] ?? sectionNameOfLine(line)} ${line}`;

export function keepPin(pin: LinePin) {
  const source = getDegreeSource();
  const previous = source.getSnapshot().history;
  source.setPin(pin);
  useDegreeUi.getState().set({ panel: null, keepPin: null, toast: { message: `${pin.code} moved to ${shortLine(pin.line)} and pinned.`, undo: previous } });
}

export function requestMove(view: DegreeView, history: DegreeHistory, pin: LinePin) {
  const outcome = moveOutcome(view.engineResult, history.pins ?? [], view.courses, pin);
  if (outcome.withPin < outcome.best) useDegreeUi.getState().set({ panel: null, keepPin: { pin, outcome } });
  else keepPin(pin);
}

export function unpin(code: string) {
  const source = getDegreeSource();
  const previous = source.getSnapshot().history;
  source.removePin(code);
  useDegreeUi.getState().set({ panel: null, toast: { message: `${code} unpinned. It’s back on its best fit.`, undo: previous } });
}

export function resetPins() {
  const source = getDegreeSource();
  const previous = source.getSnapshot().history;
  source.clearPins();
  useDegreeUi.getState().set({ panel: null, toast: { message: "Sheet reset to best fit.", undo: previous } });
}

export function removeCourse(code: string) {
  const source = getDegreeSource();
  const previous = source.getSnapshot().history;
  source.removeCourse(code);
  useDegreeUi.getState().open({ kind: "removed", code, previous });
}

export function undoTo(history: DegreeHistory) {
  getDegreeSource().replaceHistory(history);
}

export function downloadHistory() {
  const url = URL.createObjectURL(new Blob([getDegreeSource().exportHistory()], { type: "application/json;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "GoatPlan-history.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
