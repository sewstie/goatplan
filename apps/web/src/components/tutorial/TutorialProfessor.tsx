"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { lectureInstructors } from "@/lib/data";
import { usePlanner } from "@/lib/store";
import { focusTutorialTarget } from "./focusTutorialTarget";

export function TutorialProfessor() {
  const term = usePlanner((state) => state.term);
  const ready = usePlanner((state) => state.termStatus === "ready");
  const courses = usePlanner((state) => state.courses);
  const selected = usePlanner((state) => state.selectedCourse);
  const selectCourse = usePlanner((state) => state.selectCourse);
  const [focusRequest, setFocusRequest] = useState(0);
  const eligible = courses.flatMap((code) => {
    const course = term?.courses.find((item) => item.code === code);
    return course && lectureInstructors(course.sections).length > 0 ? [course] : [];
  });
  const course = eligible.find((item) => item.code === selected) ?? eligible[0];

  useEffect(() => {
    if (focusRequest > 0) focusTutorialTarget("tutorial-professor");
  }, [focusRequest]);

  if (!ready || !course) return null;

  return (
    <div className="pt-8">
      <h3 className="text-12 font-650">Choose a lecture professor if you want</h3>
      <p className="pt-5 text-12 text-ink-soft">For {course.code}, Any professor is the default. Choosing a name keeps their lectures; labs and discussions can have other instructors. This is optional.</p>
      <Button variant="soft" className="mt-8" onClick={() => {
        selectCourse(course.code);
        setFocusRequest((request) => request + 1);
      }}>Find Professor for {course.code}</Button>
    </div>
  );
}
