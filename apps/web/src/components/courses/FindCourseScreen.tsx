"use client";

import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { CaretLeft } from "@phosphor-icons/react/ssr";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/Button";
import { CheckField } from "@/components/ui/CheckField";
import { Notice } from "@/components/ui/Notice";
import { TextInput } from "@/components/ui/TextInput";
import { badgesFor, SHEET_CLASS_YEAR, useCourseGaps } from "@/lib/degree";
import { selectChosenSections, usePlanner } from "@/lib/store";
import { courseFit } from "./courseFit";
import { courseCount } from "./courseSummary";
import { FindCourseCard } from "./FindCourseCard";
import { buildSearchIndex, searchCourses } from "./searchCourses";

const MAX_RESULTS = 50;

type FindCourseScreenProps = {
  initialQuery?: string;
  onBack(): void;
};

/** The roomier search for students with My degree on: the same results with what each course would fill. */
export function FindCourseScreen({ initialQuery = "", onBack }: FindCourseScreenProps) {
  const [query, setQuery] = useState(initialQuery);
  const [onlyGaps, setOnlyGaps] = useState(false);
  const [notice, setNotice] = useState("");
  const search = useDeferredValue(query).trim();
  const inputId = useId();
  const input = useRef<HTMLDivElement>(null);
  const term = usePlanner((state) => state.term);
  const ready = usePlanner((state) => state.termStatus === "ready" && state.term !== null);
  const termLabel = usePlanner((state) => {
    const found = state.terms.find((item) => item.id === state.termId);
    return found ? `${found.name} ${found.year}` : "";
  });
  const planned = usePlanner((state) => state.courses);
  const locks = usePlanner((state) => state.locks);
  const preferences = usePlanner((state) => state.preferences);
  const chosen = usePlanner(useShallow(selectChosenSections));
  const addCourse = usePlanner((state) => state.addCourse);

  useEffect(() => {
    const element = input.current?.querySelector("input");
    element?.focus();
    element?.setSelectionRange(element.value.length, element.value.length);
  }, []);

  const index = useMemo(() => (term ? buildSearchIndex(term.courses) : []), [term]);
  const found = useMemo(() => (ready && search ? searchCourses(index, search) : []), [ready, index, search]);
  const gaps = useCourseGaps(ready && term ? term.courses : null, planned);
  const closes = gaps?.closes ?? null;
  const filtering = onlyGaps && closes !== null;
  const matches = useMemo(() => (filtering ? found.filter(({ course }) => closes.has(course.code)) : found), [filtering, closes, found]);
  const shown = useMemo(() => {
    if (!term) return [];
    const courses = planned.flatMap((code) => term.courses.find((course) => course.code === code) ?? []);
    const plan = { courses, chosen, locks, preferences };
    return matches.slice(0, MAX_RESULTS).map(({ course }) => {
      const added = planned.includes(course.code);
      return { course, added, fit: added ? null : courseFit(course, plan), countsToward: badgesFor(course.code, gaps) };
    });
  }, [term, planned, chosen, locks, preferences, matches, gaps]);

  return (
    <div className="mx-auto flex w-full max-w-730 flex-col">
      <header className="flex flex-col gap-14 tablet:flex-row tablet:items-start tablet:justify-between">
        <div>
          <h1 data-screen-heading tabIndex={-1} className="text-25 leading-30 font-700 tracking-title outline-none">Find a course</h1>
          <p className="pt-10 text-9 leading-15 text-ink-muted">{termLabel}</p>
        </div>
        <Button variant="secondary" size="md" icon={<CaretLeft aria-hidden />} className="min-h-38 self-start" onClick={onBack}>Back to planner</Button>
      </header>
      <div ref={input} className="pt-18">
        <TextInput
          id={inputId}
          label="Course code, title or professor"
          hideLabel={false}
          type="search"
          autoComplete="off"
          spellCheck={false}
          disabled={!ready}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setNotice("");
          }}
        />
      </div>
      {gaps && gaps.status !== "failed" && (
        <>
          <CheckField
            className="mt-14 rounded-tile border border-card-line bg-filter-surface px-17 py-18"
            label="Only courses that fill something I still need"
            labelClassName="text-9 leading-15 font-600"
            description="Free-elective-only matches are excluded."
            checked={onlyGaps}
            disabled={gaps.closes === null}
            onChange={(event) => setOnlyGaps(event.target.checked)}
          />
          <Notice title={`Using CS · Class of ${SHEET_CLASS_YEAR}`} className="mt-12">Based on your history, current schedule and confirmations.</Notice>
        </>
      )}
      {gaps?.status === "failed" && <p className="pt-14 text-8-5 leading-16 text-ink-muted">We couldn’t check courses against your degree, so there are no badges right now.</p>}
      <p className="sr-only" aria-live="polite">{notice} {search && `${courseCount(matches.length)} found.`}</p>
      {shown.length > 0 && (
        <ul aria-label="Search results" className="flex flex-col gap-12 pt-14">
          {shown.map((result) => (
            <FindCourseCard
              key={result.course.code}
              {...result}
              onAdd={(code) => {
                addCourse(code);
                setNotice(`${code} added.`);
              }}
            />
          ))}
        </ul>
      )}
      {search && ready && found.length === 0 && <p className="pt-16 text-9 leading-15 text-ink-muted">No course matches ‘{search}’.</p>}
      {filtering && found.length > 0 && matches.length === 0 && <p className="pt-16 text-9 leading-15 text-ink-muted">None of these fill something you still need.</p>}
      {matches.length > shown.length && <p className="pt-10 text-8 leading-14-4 text-ink-muted">Showing the first {shown.length}. Type more to narrow the list.</p>}
      <p className="pt-16 text-8 leading-14-4 text-ink-muted">Useful-course badges suggest a requirement. They don’t guarantee registration or advisor approval.</p>
    </div>
  );
}
