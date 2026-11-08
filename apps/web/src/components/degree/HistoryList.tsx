"use client";

import { MagnifyingGlass, PencilSimple, Plus, Trash } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { compareTerms, crossListed, parseTerm, sameTerm, termLong, unitLabel, type DegreeSnapshot, type HistoryCourse, type TermName } from "@/lib/degree";
import { coursePlanState } from "@/lib/degree/planGrid";
import { creditLabel } from "./creditLabel";
import { removeCourse } from "./degreeActions";
import { useDegreeUi } from "./degreeUi";
import { StatusPill } from "./StatusPill";
import { UNKNOWN_COURSE_NOTE } from "./unknownCourseNote";
import { useCurrentTerm } from "./useCurrentTerm";

type Group = { key: string; term: TermName | null; courses: HistoryCourse[] };

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

function groupCourses(courses: readonly HistoryCourse[]): Group[] {
  const groups = new Map<string, Group>();
  for (const course of courses) {
    const term = parseTerm(course.term);
    const key = term ? termLong(term) : "No term";
    const group = groups.get(key) ?? { key, term, courses: [] };
    group.courses.push(course);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => {
    if (!a.term) return 1;
    if (!b.term) return -1;
    return compareTerms(b.term, a.term);
  });
}

function subtitle(course: HistoryCourse, repeat: boolean): string {
  if (repeat) return "Duplicate record · no extra credit";
  const title = course.title || (course.source === "typed" ? UNKNOWN_COURSE_NOTE : "");
  return [creditLabel(course), title, unitLabel(course.credits)].filter(Boolean).join(" · ");
}

export function HistoryList({ degree }: { degree: DegreeSnapshot }) {
  const open = useDegreeUi((state) => state.open);
  const set = useDegreeUi((state) => state.set);
  const current = useCurrentTerm();
  const { courses } = degree.history;
  const seen = new Set<string>();
  const repeats = new Set(courses.filter((course) => {
    const repeat = seen.has(course.code);
    for (const name of crossListed(course.code)) seen.add(name);
    return repeat;
  }).map((course) => course.code));
  const counted = (group: Group) => group.courses.filter((course) => !repeats.has(course.code));

  function addTo(group: Group) {
    if (!group.term) {
      open({ kind: "manual" });
      return;
    }
    set({ addingTerm: group.key, lastAddTerm: group.key });
    open({ kind: "history", tab: "search" });
  }

  return (
    <>
      <p className="-mt-12 pb-16 text-8-5 leading-17 text-ink-muted">
        {courses.length > 0 ? `${plural(courses.length - repeats.size, "course")} · Newest terms first. Courses without a term are last.` : "Add the courses you’ve taken to see your sheet fill up."}
      </p>
      <div className="flex flex-wrap gap-8 pb-20">
        <Button size="md" icon={<MagnifyingGlass aria-hidden />} onClick={() => open({ kind: "history", tab: "search" })}>Add courses</Button>
        <Button variant="secondary" size="md" icon={<Plus aria-hidden />} onClick={() => open({ kind: "manual" })}>Manual credit</Button>
      </div>
      {groupCourses(courses).map((group) => {
        const now = sameTerm(group.term, current);
        const kept = counted(group);
        return (
          <section key={group.key} aria-label={group.key} className="pb-18">
            <div className="flex items-center gap-8 border-b border-line pb-8">
              <h3 className="text-9 leading-15 font-650">{group.key}</h3>
              {now && <span className="rounded-badge bg-accent-soft px-6 py-2 text-8 leading-11-2 font-570 text-accent">Now</span>}
              <span className="flex-1 text-8 leading-12 text-ink-muted">{plural(kept.length, "course")} · {unitLabel(kept.reduce((sum, course) => sum + course.credits, 0))}</span>
              <button type="button" aria-label={group.term ? `Add a course to ${group.key}` : "Add credit without a term"} onClick={() => addTo(group)} className="flex cursor-pointer items-center gap-4 rounded-badge px-4 py-2 text-8 leading-12 font-570 text-accent hover:bg-accent-soft">
                <Plus aria-hidden className="size-11" />Add
              </button>
            </div>
            <ul>
              {group.courses.map((course) => {
                const repeat = repeats.has(course.code);
                return (
                  <li key={course.code} className="flex items-center gap-6 border-b border-line last:border-b-0">
                    <button type="button" aria-label={`Edit ${course.code}`} onClick={() => open({ kind: "details", code: course.code })} className="group flex min-w-0 flex-1 cursor-pointer items-center gap-10 rounded-row py-10 pr-6 pl-4 text-left hover:bg-surface-subtle">
                      <span className="min-w-0 flex-1">
                        <span className="block text-9 leading-15 font-650">{course.code}</span>
                        <span className="block truncate pt-2 text-8 leading-12 text-ink-muted">{subtitle(course, repeat)}</span>
                      </span>
                      {!repeat && <StatusPill state={coursePlanState(course, current)} />}
                      <PencilSimple aria-hidden className="size-13 shrink-0 text-ink-muted group-hover:text-ink" />
                    </button>
                    <IconButton label={`Remove ${course.code}`} icon={<Trash aria-hidden />} onClick={() => removeCourse(course.code)} />
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}
