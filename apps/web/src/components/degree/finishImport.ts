import type { ImportPreview } from "@/lib/degree";
import { useDegreeUi } from "./degreeUi";

/** Closes the review, and asks the student to look when a pin from the file couldn't come along. */
export function finishImport({ pins, fileName, newCourses }: ImportPreview) {
  const rejected = pins.filter((pin) => !pin.allowed).map(({ code, line }) => ({ code, line }));
  const kept = pins.filter((pin) => pin.allowed).map(({ code, line }) => ({ code, line }));
  useDegreeUi.getState().set({
    panel: null,
    restored: rejected.length > 0 ? { rejected, kept, fileName } : null,
    toast: rejected.length > 0 ? null : { message: `${newCourses} ${newCourses === 1 ? "course" : "courses"} imported.` },
  });
}
