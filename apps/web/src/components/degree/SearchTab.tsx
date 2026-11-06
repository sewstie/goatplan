"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Plus } from "@phosphor-icons/react/ssr";
import { buildSearchIndex, searchCourses } from "@/components/courses/searchCourses";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TextInput } from "@/components/ui/TextInput";
import type { Course } from "@/lib/data/types";
import { foundCourse, getDegreeSource, unitLabel, type DegreeHistory } from "@/lib/degree";
import { hasRegistrationCode } from "@/lib/degree/history";
import { termChoices } from "./termChoices";
import { useCourseCatalog } from "./useCourseCatalog";
import { useDegreeUi } from "./degreeUi";

const MAX_RESULTS = 8;

export function SearchTab({ history }: { history: DegreeHistory }) {
  const open = useDegreeUi((state) => state.open);
  const catalog = useCourseCatalog();
  const { load } = catalog;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"taken" | "planned">("taken");
  const [term, setTerm] = useState("");
  const [notice, setNotice] = useState("");
  const search = useDeferredValue(query).trim();

  useEffect(() => {
    void load();
  }, [load]);

  const courses = catalog.courses;
  const index = useMemo(() => buildSearchIndex(courses ?? []), [courses]);
  const matches = useMemo(() => (search ? searchCourses(index, search).slice(0, MAX_RESULTS).map((match) => match.course) : []), [index, search]);
  const added = new Set(history.courses.map((course) => course.code));

  function use(course: Course) {
    const result = getDegreeSource().addCourse({ ...foundCourse(course), status, ...(term ? { term } : {}) });
    setNotice(result === "duplicate" ? `${course.code} is already in your history.` : result === "invalid" ? "That course couldn’t be added. Try manual entry." : result === "unsaved" ? `${course.code} added for this visit. Browser storage is unavailable.` : `${course.code} added to your history.`);
  }

  return (
    <>
      <p className="pb-20 text-8-5 leading-17 text-ink-muted">Search the course catalog, or enter AP and transfer courses yourself.</p>
      <TextInput label="Course code or title" hideLabel={false} autoComplete="off" spellCheck={false} value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="grid grid-cols-2 gap-12 pt-16">
        <Select label="Status" hideLabel={false} variant="box" options={[{ value: "taken", label: "Taken" }, { value: "planned", label: "Planned" }]} value={status} onChange={(event) => setStatus(event.target.value as "taken" | "planned")} />
        <Select label="Term (optional)" hideLabel={false} variant="box" options={termChoices()} value={term} onChange={(event) => setTerm(event.target.value)} />
      </div>
      <p role="status" className="min-h-16 pt-4 text-8 leading-12 text-ink-muted">{notice}</p>
      {catalog.failed && <div role="alert" className="pt-8"><p className="pb-8 text-8 text-ink-muted">The course catalog couldn’t be loaded.</p><Button variant="secondary" onClick={() => void load()}>Try again</Button></div>}
      {!catalog.ready && !catalog.failed && <p className="pt-8 text-8 text-ink-muted">Loading catalog…</p>}
      {matches.length > 0 && (
        <section aria-label="Matching course" className="mt-2 rounded-card border border-card-line px-16 pt-14 pb-4">
          <h3 className="pb-8 text-8-5 leading-16 font-650">Matching course</h3>
          <ul>
            {matches.map((course, index) => {
              const isAdded = added.has(course.code);
              return (
                <li key={course.code} className="flex items-center justify-between gap-16 border-b border-line py-12 last:border-b-0">
                  <div className="min-w-0">
                    <p className="text-8-5 leading-16 font-650">{course.code}</p>
                    <p className="pt-3 text-8 leading-14-4 text-ink-muted">{course.title}{course.credits !== null ? ` · ${unitLabel(course.credits)}` : ""}</p>
                    {!hasRegistrationCode(course.code) && <p className="pt-3 text-8 leading-14-4 text-ink-muted">Kept for review. Enter its numbered WPI course code manually before it can count.</p>}
                    {catalog.courses.find((item) => item.code === course.code)?.offeredThisYear === false && <p className="pt-3 text-8 leading-14-4 text-ink-muted">Not offered in 2026–27</p>}
                  </div>
                  <Button variant={index === 0 && !isAdded ? "primary" : "secondary"} size="md" aria-label={isAdded ? `${course.code} added` : `Use ${course.code}`} aria-disabled={isAdded || undefined} className="min-h-38" onClick={() => !isAdded && use(course)}>
                    {isAdded ? "Added" : "Use course"}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <section className="mt-18 rounded-card bg-canvas px-16 py-16">
        <h3 className="text-8-5 leading-16 font-650">Can’t find a retired or transfer course?</h3>
        <p className="pt-7 text-8 leading-14-4 text-ink-muted">You can enter the code and credits manually.</p>
        <Button variant="secondary" size="md" icon={<Plus aria-hidden />} className="mt-12 min-h-38" onClick={() => open({ kind: "manual" })}>Enter a course manually</Button>
      </section>
    </>
  );
}
