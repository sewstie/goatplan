"use client";

import { useState } from "react";
import { foundCourse, getDegreeSource, loadCatalog, parseTerm, termLong } from "@/lib/degree";
import { validHistoryTerm } from "@/lib/degree/history";
import { selectSavedPlan, usePlanner } from "@/lib/store";
import { addPlanMessage, type AddPlanMessage } from "./addPlanMessage";

export interface PlanCourse {
  code: string;
  title: string;
}

/** The displayed plan's courses, and adding them to My degree as planned for the plan's term. */
export function useAddPlanToDegree() {
  const courses = usePlanner((state) => state.courses);
  const file = usePlanner((state) => state.term);
  const saved = usePlanner(selectSavedPlan);
  const [result, setResult] = useState<{ key: string; message: AddPlanMessage } | null>(null);
  const codes = saved ? saved.courses : courses;
  const term = parseTerm(saved?.termId ?? file?.term.id);
  const termName = term ? termLong(term) : "";
  const trackable = !!term && validHistoryTerm(termName);
  const key = `${termName}|${codes.join(",")}`;
  const list: PlanCourse[] = codes.map((code) => ({ code, title: file?.courses.find((course) => course.code === code)?.title ?? saved?.schedule.find((course) => course.code === code)?.title ?? "" }));

  async function add() {
    if (!file || !term) return;
    const missing = codes.some((code) => !file.courses.some((course) => course.code === code));
    const catalog = missing ? await loadCatalog() : null;
    const entries = codes.map((code) => {
      const course = file.courses.find((item) => item.code === code) ?? catalog?.courses.find((item) => item.code === code);
      const savedCourse = saved?.schedule.find((item) => item.code === code);
      return { ...foundCourse(course ?? { code, title: savedCourse?.title ?? "", credits: savedCourse?.sections.find((section) => section.credits != null)?.credits ?? 3 }), status: "planned" as const, term: termName };
    });
    setResult({ key, message: addPlanMessage(getDegreeSource().addCourses(entries), codes.length, termName) });
  }

  return {
    courses: list,
    termName,
    ready: !!file && trackable && codes.length > 0,
    reason: codes.length === 0 ? "Pick courses first" : trackable ? "" : "This term can’t be tracked yet",
    message: result?.key === key ? result.message : null,
    add,
  };
}
