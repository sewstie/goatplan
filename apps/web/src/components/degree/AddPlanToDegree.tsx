"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { foundCourse, getDegreeSource, loadCatalog, parseTerm, termLong } from "@/lib/degree";
import { validHistoryTerm } from "@/lib/degree/history";
import { useDegreeEnabled } from "@/lib/flags";
import { selectSavedPlan, usePlanner } from "@/lib/store";

export function AddPlanToDegree() {
  const enabled = useDegreeEnabled();
  const courses = usePlanner((state) => state.courses);
  const file = usePlanner((state) => state.term);
  const saved = usePlanner(selectSavedPlan);
  const [notice, setNotice] = useState("");
  if (!enabled) return null;
  const codes = saved ? saved.courses : courses;
  const term = parseTerm(saved?.termId ?? file?.term.id);

  async function add() {
    if (!file || !term) return;
    const missing = codes.some((code) => !file.courses.some((course) => course.code === code));
    const catalog = missing ? await loadCatalog() : null;
    const list = codes.map((code) => {
      const course = file.courses.find((item) => item.code === code) ?? catalog?.courses.find((item) => item.code === code);
      const savedCourse = saved?.schedule.find((item) => item.code === code);
      return { ...foundCourse(course ?? { code, title: savedCourse?.title ?? "", credits: savedCourse?.sections.find((section) => section.credits != null)?.credits ?? 3 }), status: "planned" as const, term: termLong(term) };
    });
    const result = getDegreeSource().addCourses(list);
    setNotice(result.status === "invalid" ? "These courses couldn’t be added. Check the plan’s term." : result.status === "unsaved" ? "Added for this visit. Browser storage is unavailable." : `${result.added} courses added to My degree as planned. Existing entries kept.`);
  }

  return <div className="max-w-280">
    <Button variant="secondary" size="sm" disabled={!file || !term || !validHistoryTerm(termLong(term)) || codes.length === 0} className="min-h-44 whitespace-normal! text-left" onClick={() => void add()}>Add these courses to My degree as planned</Button>
    {notice && <p role="status" className="px-8 pt-8 text-8 leading-16 text-ink-muted">{notice}</p>}
  </div>;
}
