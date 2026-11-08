"use client";

import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, MagnifyingGlass, Plus } from "@phosphor-icons/react/ssr";
import { buildSearchIndex, searchCourses } from "@/components/courses/searchCourses";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { DrawerFrame } from "@/components/ui/Drawer";
import { Notice } from "@/components/ui/Notice";
import { TextInput } from "@/components/ui/TextInput";
import type { Course } from "@/lib/data/types";
import { cleanCourseCode, foundCourse, getDegreeSource, huaProblem, offeringNote, unitLabel, type DegreeHistory } from "@/lib/degree";
import { hasRegistrationCode } from "@/lib/degree/history";
import { statusOfState } from "@/lib/degree/planGrid";
import { offerHint, termOffers } from "@/lib/degree/termOfferings";
import { AddedStatus, type Added } from "./AddedStatus";
import { AddTargetCard } from "./AddTargetCard";
import { useDegreeUi } from "./degreeUi";
import { PLAN_STATES } from "./planStateLook";
import { useAddTarget } from "./useAddTarget";
import { useCourseCatalog } from "./useCourseCatalog";
import { useOfferedCodes } from "./useTermOfferings";

const MAX_RESULTS = 8;

export function SearchTab({ history }: { history: DegreeHistory }) {
  const open = useDegreeUi((state) => state.open);
  const close = useDegreeUi((state) => state.close);
  const { target, change, current, startYear } = useAddTarget();
  const catalog = useCourseCatalog();
  const { load } = catalog;
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [added, setAdded] = useState<Added | null>(null);
  const search = useDeferredValue(query).trim();

  useEffect(() => {
    void load();
  }, [load]);

  const courses = catalog.courses;
  const index = useMemo(() => buildSearchIndex(courses ?? []), [courses]);
  const matches = useMemo(() => (search ? searchCourses(index, search).slice(0, MAX_RESULTS).map((match) => match.course) : []), [index, search]);
  const catalogCourses = useMemo(() => new Map(courses.map((course) => [course.code, course])), [courses]);
  const inHistory = new Set(history.courses.map((course) => course.code));
  const highlighted = Math.min(active, Math.max(0, matches.length - 1));
  const typedCode = search && matches.length === 0 ? cleanCourseCode(search) : null;
  const stateWord = PLAN_STATES[target.state].label.toLowerCase();
  const status = statusOfState(target.state);
  const sheet = getDegreeSource().getSnapshot().sheet;
  const huaNote = (code: string) => (sheet ? huaProblem(code, history.courses, sheet) : null);
  const offered = useOfferedCodes().codes;
  const offerNote = (code: string) => (status === "taken" ? null : offerHint(code, target.term, termOffers(code, offered)));

  function add(course: Course) {
    if (inHistory.has(course.code)) {
      setAdded({ codes: [course.code], text: `${course.code} is already in your history.`, undo: false });
      return;
    }
    const hua = huaNote(course.code);
    if (hua && status === "planned") {
      setAdded({ codes: [course.code], text: hua, undo: false });
      return;
    }
    const result = getDegreeSource().addCourse({ ...foundCourse(course), status, ...(target.term ? { term: target.term } : {}) });
    const where = target.term || "your history";
    if (result === "duplicate") setAdded({ codes: [course.code], text: `${course.code} is already in your history.`, undo: false });
    else if (result === "invalid") setAdded({ codes: [course.code], text: "That course couldn’t be added. Try manual credit.", undo: false });
    else {
      const offer = offerNote(course.code);
      const notOffered = offer && !offer.offered ? ` ${offer.text}` : "";
      setAdded({ codes: [course.code], text: `${course.code} added to ${where} as ${stateWord}.${result === "unsaved" ? " Browser storage is unavailable." : ""}${hua ? ` ${hua}` : ""}${notOffered}`, undo: true });
    }
  }

  function undo(codes: string[]) {
    for (const code of codes) getDegreeSource().removeCourse(code);
    setAdded({ codes, text: `${codes.join(", ")} removed.`, undo: false });
    input.current?.focus();
  }

  return (
    <DrawerFrame
      title="Add courses"
      onClose={close}
      footer={<Button size="md" className="min-h-40" onClick={() => open({ kind: "history", tab: "history" })}>Done</Button>}
    >
      <p className="-mt-12 pb-18 text-8-5 leading-17 text-ink-muted">Find a course across published years and the catalog.</p>
      <AddTargetCard target={target} onChange={change} startYear={startYear} current={current} />
      <TextInput
        ref={input}
        className="pt-18"
        label="Course code or title"
        hideLabel={false}
        role="combobox"
        aria-expanded={matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={matches[highlighted] ? `${listId}-${highlighted}` : undefined}
        icon={<MagnifyingGlass />}
        autoFocus
        autoComplete="off"
        spellCheck={false}
        placeholder="CS 2102 or Algorithms"
        hint="All years and the WPI catalog. Enter adds the highlighted course."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setActive(Math.max(0, Math.min(matches.length - 1, highlighted + (event.key === "ArrowDown" ? 1 : -1))));
          } else if (event.key === "Enter" && matches[highlighted]) {
            event.preventDefault();
            add(matches[highlighted]);
            event.currentTarget.select();
          }
        }}
      />
      <AddedStatus added={added} onUndo={undo} />
      {catalog.failed && <div role="alert" className="pt-4"><p className="pb-8 text-8 text-ink-muted">The course catalog couldn’t be loaded.</p><Button variant="secondary" onClick={() => void load()}>Try again</Button></div>}
      {search && !catalog.ready && !catalog.failed && <p className="pt-4 text-8 text-ink-muted">Loading catalog…</p>}
      {matches.length > 0 && (
        <ul id={listId} role="listbox" aria-label="Matching courses" className="flex flex-col gap-2">
          {matches.map((course, position) => {
            const already = inHistory.has(course.code);
            const known = catalogCourses.get(course.code);
            const note = known && offeringNote(known);
            const blocked = !already && status === "planned" ? huaNote(course.code) : null;
            const offer = already || blocked ? null : offerNote(course.code);
            return (
              <li key={course.code} id={`${listId}-${position}`} role="option" aria-selected={position === highlighted} onMouseEnter={() => setActive(position)} className={cx("flex items-center justify-between gap-12 rounded-row px-10 py-9", position === highlighted && !already && "bg-surface-selected")}>
                <div className="min-w-0">
                  <p className="text-9 leading-15 font-650">{course.code}</p>
                  <p className="truncate pt-2 text-8 leading-12 text-ink-muted">{course.title}{course.credits !== null ? ` · ${unitLabel(course.credits)}` : ""}</p>
                  {!hasRegistrationCode(course.code) && <p className="pt-2 text-8 leading-12 text-ink-muted">Kept for review. It needs a numbered WPI course code to count.</p>}
                  {blocked && <p className="pt-2 text-8 leading-12 text-warning-ink">{blocked}</p>}
                  {offer && <p className={cx("pt-2 text-8 leading-12", offer.offered ? "text-success-ink" : "text-warning-ink")}>{offer.text}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-8">
                  {note && !already && !blocked && !offer && <Badge tone="warning" size="sm">{note}</Badge>}
                  {blocked ? (
                    <Badge tone="warning" size="sm">Can’t count</Badge>
                  ) : already ? (
                    <Badge tone="accent" size="sm" className="gap-4"><Check aria-hidden weight="bold" className="size-10" />In history</Badge>
                  ) : (
                    <Button size="sm" variant={position === highlighted ? "primary" : "secondary"} icon={<Plus aria-hidden />} aria-label={`Add ${course.code}`} onClick={() => add(course)}>Add</Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {search && catalog.ready && matches.length === 0 && (
        <div className="rounded-card border border-card-line px-14 py-14">
          <p className="text-8-5 leading-16">No course matches “{search}”.</p>
          {typedCode && <Button variant="secondary" size="sm" icon={<Plus aria-hidden />} className="mt-10" onClick={() => open({ kind: "manual", code: typedCode })}>Add {typedCode} as manual credit</Button>}
        </div>
      )}
      <Notice title="Adding to history doesn’t depend on term offerings" className="mt-18">Use manual credit for AP or IB exam credit, or a WPI course the search can’t find.</Notice>
      <Button variant="secondary" size="md" icon={<Plus aria-hidden />} className="mt-12 self-start" onClick={() => open({ kind: "manual" })}>Add manual credit</Button>
    </DrawerFrame>
  );
}
