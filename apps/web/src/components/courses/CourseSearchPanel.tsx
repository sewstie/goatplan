"use client";

import { useDeferredValue, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { selectChosenSections, usePlanner } from "@/lib/store";
import { normalizeCourseCode } from "./courseCode";
import { courseFit } from "./courseFit";
import { useCourseSelection } from "./courseSelection";
import { courseCount } from "./courseSummary";
import { NoMatchMessage } from "./NoMatchMessage";
import { NotOfferedMessage } from "./NotOfferedMessage";
import { joinTermNames } from "./otherTerms";
import { SearchBox } from "./SearchBox";
import { buildSearchIndex, searchCourses, suggestCourseCode } from "./searchCourses";
import { SearchResults } from "./SearchResults";
import { useTermsWithCourse } from "./useTermsWithCourse";
import { YourCourses } from "./YourCourses";

/** Results past this many are counted but not drawn; typing more narrows them down. */
const MAX_RESULTS = 50;

/** The search box, search results and "Your courses" (div.app-3.md, div.app-4.md, div.app-5.md). */
export function CourseSearchPanel() {
  const [query, setQuery] = useState("");
  const [added, setAdded] = useState<string | null>(null);
  const search = useDeferredValue(query).trim();

  const termStatus = usePlanner((state) => state.termStatus);
  const term = usePlanner((state) => state.term);
  const termName = usePlanner((state) => state.terms.find((item) => item.id === state.termId)?.name ?? "");
  const planned = usePlanner((state) => state.courses);
  const locks = usePlanner((state) => state.locks);
  const preferences = usePlanner((state) => state.preferences);
  const chosen = usePlanner(useShallow(selectChosenSections));
  const addCourse = usePlanner((state) => state.addCourse);
  const setTerm = usePlanner((state) => state.setTerm);
  const select = useCourseSelection((state) => state.select);

  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const resultsId = useId();

  const ready = termStatus === "ready" && term !== null;
  const index = useMemo(() => (term ? buildSearchIndex(term.courses) : []), [term]);
  const matches = useMemo(() => (ready && search ? searchCourses(index, search) : []), [ready, index, search]);

  const shown = useMemo(() => {
    if (!term) return [];
    const courses = planned.flatMap((code) => term.courses.find((course) => course.code === code) ?? []);
    const plan = { courses, chosen, locks, preferences };
    return matches.slice(0, MAX_RESULTS).map(({ course }) => {
      const isAdded = planned.includes(course.code);
      return { course, added: isAdded, fit: isAdded ? null : courseFit(course, plan) };
    });
  }, [term, planned, chosen, locks, preferences, matches]);

  const code = normalizeCourseCode(search);
  const missingCode = ready && matches.length === 0 && code !== null ? code : null;
  const runsIn = useTermsWithCourse(missingCode);
  const notOffered = missingCode !== null && runsIn !== null && runsIn.length > 0;
  const showResults = ready && search !== "";
  const waiting = missingCode !== null && runsIn === null;

  let status = "";
  if (showResults && matches.length > 0) status = `${courseCount(matches.length)} found.`;
  else if (showResults && notOffered) status = `${missingCode} isn’t offered in ${termName}. It runs in ${joinTermNames(runsIn)}.`;
  else if (showResults && !waiting) status = `No course matches ‘${search}’.`;

  function changeQuery(value: string) {
    setQuery(value);
    setAdded(null);
  }

  function add(courseCode: string) {
    addCourse(courseCode);
    select(courseCode);
    setAdded(courseCode);
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter") {
      const exact = normalizeCourseCode(query);
      if (event.key === "Enter" && ready && exact && term.courses.some((course) => course.code === exact)) {
        event.preventDefault();
        if (!planned.includes(exact)) add(exact);
        setQuery("");
        return;
      }
      const first = listRef.current?.querySelector<HTMLElement>("[data-result-action]");
      if (first) {
        event.preventDefault();
        first.focus();
      }
    } else if (event.key === "Escape" && query) {
      event.preventDefault();
      changeQuery("");
    }
  }

  return (
    <>
      <SearchBox
        inputRef={searchRef}
        value={query}
        onChange={changeQuery}
        onKeyDown={onSearchKeyDown}
        disabled={termStatus === "error"}
        resultsId={resultsId}
      />
      <div id={resultsId} className="flex shrink-0 flex-col">
        {showResults &&
          (matches.length > 0 ? (
            <SearchResults
              listRef={listRef}
              results={shown}
              total={matches.length}
              onAdd={add}
              onLeave={() => searchRef.current?.focus()}
            />
          ) : notOffered ? (
            <NotOfferedMessage
              code={missingCode}
              termName={termName}
              runsIn={runsIn}
              onSwitch={(termId) => void setTerm(termId)}
            />
          ) : waiting ? null : (
            <NoMatchMessage query={search} suggestion={suggestCourseCode(search, term.courses)} />
          ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {added ? `${added} added. ` : ""}
        {status}
      </p>
      <YourCourses searchRef={searchRef} />
    </>
  );
}
