"use client";

import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { foundCourse, getDegreeSource, nextTerm, parseTerm, termLong, unitLabel, type DegreeHistory } from "@/lib/degree";
import { coursesForLine, matchesQuery, needsPin, type LineCourse } from "@/lib/degree/lineCourses";
import { stateForTerm, statusOfState } from "@/lib/degree/planGrid";
import { termIdOf } from "@/lib/degree/termOfferings";
import { useDegreeUi } from "./degreeUi";
import { shortLine } from "./degreeActions";
import { TermStatusFields, type TermAndState } from "./TermStatusFields";
import { useCourseCatalog } from "./useCourseCatalog";
import { useCurrentTerm } from "./useCurrentTerm";
import { usePlanStart } from "./usePlanStart";
import { usePublishedTerms } from "./usePublishedTerms";
import { useOfferedCodes } from "./useTermOfferings";
import type { DegreeView } from "./useDegreeView";

const PAGE = 20;

export function LineCourseList({ line, view, history }: { line: number; view: DegreeView; history: DegreeHistory }) {
  const set = useDegreeUi((state) => state.set);
  const current = useCurrentTerm();
  const startYear = usePlanStart();
  const catalog = useCourseCatalog();
  const { load } = catalog;
  const published = usePublishedTerms();
  const offered = useOfferedCodes();
  const [when, setWhen] = useState<TermAndState>(() => {
    const term = termLong(nextTerm(current));
    return { term, state: stateForTerm(parseTerm(term), current) };
  });
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const sheet = getDegreeSource().getSnapshot().sheet;

  useEffect(() => { void load(); }, [load]);

  const named = parseTerm(when.term);
  const termId = named ? termIdOf(named) : null;
  const hasSchedule = termId !== null && published.terms.some((term) => term.id === termId);
  const schedule = termId && hasSchedule ? (offered.codes.get(termId) ?? null) : null;
  const waiting = (!catalog.ready && !catalog.failed) || published.status === "loading" || (hasSchedule && !offered.ready);
  const fits = useMemo(
    () => (sheet && !waiting ? coursesForLine({ line, courses: catalog.courses, history: history.courses, sheet, term: parseTerm(when.term), offered: schedule }) : []),
    [sheet, waiting, line, catalog.courses, history.courses, when.term, schedule],
  );
  const shown = query.trim() ? fits.filter((item) => [item.name, ...item.others].some((code) => matchesQuery({ code, title: item.course.title }, query))) : fits;

  const scope = !named ? "" : published.status === "failed"
    ? `The list of published schedules couldn’t be loaded, so every course that fits is shown.`
    : schedule
    ? `Courses offered in ${when.term} that fit this line.`
    : hasSchedule
      ? `The ${when.term} schedule couldn’t be loaded, so every course that fits is shown.`
      : `The ${when.term} schedule isn’t out yet, so every course that fits is shown.`;

  function add({ course, name }: LineCourse) {
    const source = getDegreeSource();
    const previous = source.getSnapshot().history;
    const result = source.addCourse({ ...foundCourse(course), status: statusOfState(when.state), term: when.term });
    if (result === "duplicate" || result === "invalid") {
      set({ toast: { message: result === "duplicate" ? `${name} is already in your history.` : `${name} couldn’t be added.` } });
      return;
    }
    const empty = view.sheet.sections.flatMap((section) => section.tiles).filter((tile) => tile.kind === "empty").map((tile) => tile.line);
    if (sheet && needsPin(course.code, course.credits ?? 3, line, empty, sheet)) source.setPin({ code: course.code, line });
    const unsaved = result === "unsaved" ? " Browser storage is unavailable." : "";
    set({ panel: null, toast: { message: `${name} added to ${shortLine(line)} for ${when.term}.${unsaved}`, undo: previous } });
  }

  return (
    <section aria-labelledby={`line-${line}-add`} className="pt-18">
      <h3 id={`line-${line}-add`} className="pb-14 text-8-5 leading-16 font-650">Add a course</h3>
      <div className="rounded-card bg-canvas px-14 py-14">
        <TermStatusFields term={when.term} state={when.state} onChange={(next) => { setWhen(next); setLimit(PAGE); }} startYear={startYear} current={current} allowNone={false} />
      </div>
      <TextInput
        className="pt-16"
        label="Filter courses"
        hideLabel={false}
        icon={<MagnifyingGlass />}
        placeholder="Code or title"
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={(event) => { setQuery(event.target.value); setLimit(PAGE); }}
      />
      <p role="status" className="pt-10 text-8 leading-16 text-ink-muted">
        {catalog.failed ? "" : waiting ? "Loading courses…" : [scope, shown.length > 0 && `${shown.length} ${shown.length === 1 ? "course" : "courses"}.`].filter(Boolean).join(" ")}
      </p>
      {catalog.failed && <div role="alert" className="pt-4"><p className="pb-8 text-8 text-ink-muted">The course catalog couldn’t be loaded.</p><Button variant="secondary" onClick={() => void load()}>Try again</Button></div>}
      {!waiting && shown.length === 0 && !catalog.failed && (
        <p className="py-12 text-8-5 leading-16 text-ink-muted">
          {query.trim() ? `No course matches “${query.trim()}”.` : schedule ? `No course that fits this line is offered in ${when.term}. Try another term.` : "No course in the catalog fits this line."}
        </p>
      )}
      <ul className="divide-y divide-line">
        {shown.slice(0, limit).map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-12 py-10">
            <div className="min-w-0">
              <p className="text-9 leading-15 font-650">{item.name}{item.others.length > 0 && <span className="font-510 text-ink-muted"> · also {item.others.join(", ")}</span>}</p>
              <p className="truncate pt-2 text-8 leading-12 text-ink-muted">{item.course.title}{item.course.credits !== null ? ` · ${unitLabel(item.course.credits)}` : ""}</p>
            </div>
            <Button size="sm" variant="secondary" icon={<Plus aria-hidden />} aria-label={`Add ${item.name} for ${when.term}`} onClick={() => add(item)}>Add</Button>
          </li>
        ))}
      </ul>
      {shown.length > limit && <Button variant="secondary" size="sm" className="mt-10" onClick={() => setLimit(limit + PAGE)}>Show more courses</Button>}
    </section>
  );
}
