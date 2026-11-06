"use client";

import { CaretRight, DownloadSimple, UploadSimple } from "@phosphor-icons/react/ssr";
import { compareTerms, crossListed, formatUnits, parseTerm, termLong, unitLabel, type DegreeSnapshot, type HistoryCourse, type TermName } from "@/lib/degree";
import { downloadHistory } from "./degreeActions";
import { useDegreeUi } from "./degreeUi";
import { UNKNOWN_COURSE_NOTE } from "./unknownCourseNote";
import type { DegreeView } from "./useDegreeView";

type Group = { key: string; title: string; term: TermName | null; courses: HistoryCourse[] };

function groupCourses(courses: readonly HistoryCourse[]): Group[] {
  const groups = new Map<string, Group>();
  for (const course of courses) {
    const term = parseTerm(course.term);
    const key = term ? termLong(term) : "No term";
    const group = groups.get(key) ?? { key, title: key, term, courses: [] };
    group.courses.push(course);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => {
    if (!a.term) return 1;
    if (!b.term) return -1;
    return compareTerms(b.term, a.term);
  });
}

export function HistoryList({ degree }: { degree: DegreeSnapshot; view: DegreeView | null }) {
  const open = useDegreeUi((state) => state.open);
  const { courses } = degree.history;
  const seen = new Set<string>();
  const repeats = new Set(courses.filter((course) => {
    const repeat = seen.has(course.code);
    for (const name of crossListed(course.code)) seen.add(name);
    return repeat;
  }).map((course) => course.code));
  const counted = (group: Group) => group.courses.filter((course) => !repeats.has(course.code)).reduce((sum, course) => sum + course.credits, 0);

  return (
    <>
      <div className="flex items-center justify-between gap-12 pb-10">
        <p className="text-8 leading-14-4 text-ink-muted">{courses.length} {courses.length === 1 ? "record" : "records"} · {courses.length - repeats.size} {courses.length - repeats.size === 1 ? "course" : "courses"}</p>
        <div className="flex gap-14">
          <button type="button" onClick={downloadHistory} className="flex cursor-pointer items-center gap-5 rounded-badge text-8 leading-14-4 font-510 text-accent hover:underline"><DownloadSimple aria-hidden className="size-13 text-ink" />Export</button>
          <button type="button" onClick={() => open({ kind: "transfer" })} className="flex cursor-pointer items-center gap-5 rounded-badge text-8 leading-14-4 font-510 text-accent hover:underline"><UploadSimple aria-hidden className="size-13 text-ink" />Import</button>
        </div>
      </div>
      {courses.length === 0 && <p className="py-20 text-center text-8-5 leading-16 text-ink-muted">No courses yet. Add the ones you’ve taken to see your sheet fill up.</p>}
      {groupCourses(courses).map((group) => (
        <section key={group.key} aria-label={group.title} className="pb-16">
          <div className="flex items-center justify-between gap-12 border-b border-line pb-9">
            <h3 className="text-8-5 leading-16 font-650">{group.title}</h3>
            <span className="text-8 leading-14-4 text-ink-muted">{unitLabel(counted(group))}</span>
          </div>
          <ul>
            {group.courses.map((course) => {
              const repeat = repeats.has(course.code);
              const subtitle = repeat ? "Duplicate record · no extra credit" : course.status === "planned" ? (course.title ? `${course.title} · Planned` : "Planned") : course.title || (course.source === "typed" ? UNKNOWN_COURSE_NOTE : "");
              return (
                <li key={course.code} className="border-b border-line last:border-b-0">
                  <button type="button" aria-label={`${course.code} details`} onClick={() => open({ kind: "details", code: course.code })} className="flex w-full cursor-pointer items-center justify-between gap-12 py-14 text-left hover:bg-surface-subtle">
                    <span className="min-w-0">
                      <span className="block text-8-5 leading-16 font-650">{course.code}</span>
                      {subtitle && <span className="block pt-3 text-8 leading-14-4 text-ink-muted">{subtitle}</span>}
                    </span>
                    <span className="flex shrink-0 items-center gap-12 text-8 leading-14-4 text-ink-muted">
                      {repeat ? "—" : formatUnits(course.credits)}
                      <CaretRight aria-hidden className="size-11" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
