import type { ImportPreview } from "@/lib/degree";
import { useDegreeUi } from "./degreeUi";

export function finishImport({ pins, fileName, newCourses }: ImportPreview) {
  const rejected = pins.filter((pin) => !pin.allowed).map(({ code, line }) => ({ code, line }));
  const kept = pins.filter((pin) => pin.allowed).map(({ code, line }) => ({ code, line }));
  useDegreeUi.getState().set({
    panel: null,
    restored: rejected.length > 0 ? { rejected, kept, fileName } : null,
    toast: rejected.length > 0 ? null : { message: `${newCourses} ${newCourses === 1 ? "course" : "courses"} imported.` },
  });
}
