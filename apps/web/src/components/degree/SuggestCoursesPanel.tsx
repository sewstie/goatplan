"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { DrawerFrame } from "@/components/ui/Drawer";
import { loadTerm } from "@/lib/data/load";
import type { TermFile } from "@/lib/data/types";
import { getEngineClient } from "@/lib/engine";
import { createGapSource } from "@/lib/degree/courseGaps";
import { foundCourse, getDegreeSource, parseTerm, seminarTooEarly, suggestions, type DegreeHistory } from "@/lib/degree";
import { isOffered, offering as offeringIn, type OfferingInput } from "@/lib/degree/recommendations/offerings";
import { useCourseCatalog } from "./useCourseCatalog";
import { usePublishedTerms } from "./usePublishedTerms";
import { useDegreeUi } from "./degreeUi";
import { TermPicker } from "./TermPicker";
import { useCurrentTerm } from "./useCurrentTerm";
import { usePlanStart } from "./usePlanStart";
import { OpenInPlanner } from "./OpenInPlanner";

function SuggestFrame({ inline, close, children }: { inline: boolean; close(): void; children: ReactNode }) {
  return inline ? <section aria-label="Suggestions" className="degree-suggestions"><h2 className="text-17 font-650">Suggestions</h2>{children}</section> : <DrawerFrame title="Suggest courses" onClose={close}>{children}</DrawerFrame>;
}

export function SuggestCoursesPanel({ history, line, inline = false }: { history: DegreeHistory; line?: number; inline?: boolean }) {
  const close = useDegreeUi((state) => state.close);
  const catalog = useCourseCatalog();
  const { load } = catalog;
  const publishedTerms = usePublishedTerms();
  const startYear = usePlanStart();
  const current = useCurrentTerm();
  const [term, setTerm] = useState("A Term 2026");
  const [file, setFile] = useState<TermFile | null>(null);
  const [failed, setFailed] = useState(false);
  const [offeringAttempt, setOfferingAttempt] = useState(0);
  const [notice, setNotice] = useState("");
  const [limit, setLimit] = useState(30);
  const named = parseTerm(term)!;
  const termId = `${named.year}-${named.letter}`;
  const published = publishedTerms.terms.some((item) => item.id === termId);
  const source = useMemo(() => createGapSource({ degree: getDegreeSource(), engine: getEngineClient() }), []);
  const gaps = useSyncExternalStore(source.subscribe, source.getSnapshot, source.getSnapshot);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (catalog.ready) source.setOpenTerm({ courses: catalog.courses, planned: [] }); }, [source, catalog.courses, catalog.ready]);
  useEffect(() => {
    if (!published) return;
    let live = true;
    void loadTerm(termId).then((loaded) => { if (live) setFile(loaded); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [published, termId, offeringAttempt]);

  const known = new Set(history.courses.map((course) => course.code));
  const offered = file?.term.id === termId ? file : null;
  const catalogByCode = useMemo(() => new Map(catalog.courses.map((course) => [course.code, course])), [catalog.courses]);
  const termOffering: OfferingInput | null = publishedTerms.status !== "ready" ? null : !published ? { status: "unpublished" } : offered ? { status: "published", file: offered } : null;
  const offeredThen = (code: string) => {
    const course = catalogByCode.get(code);
    return !termOffering || !course || isOffered(offeringIn(course, named, termOffering));
  };
  const details = gaps.details ? new Map([...gaps.details].filter(([code, fit]) => !known.has(code) && !seminarTooEarly(code, history.courses, named) && (line === undefined || fit.lines.includes(line)) && offeredThen(code))) : null;
  const list = suggestions(details, limit);

  return (
    <SuggestFrame inline={inline} close={close}>
      <p className="pb-16 text-8-5 leading-17 text-ink-muted">Courses that fill an open line or check.</p>
      <TermPicker label={inline ? "Registration term" : "Term to plan for"} value={term} onChange={(value) => { setTerm(value); setFailed(false); }} startYear={startYear} current={current} />
      {catalog.failed && <div role="alert"><p className="py-8 text-8 text-ink-muted">The course catalog couldn’t be loaded.</p><Button variant="secondary" onClick={() => void load()}>Try again</Button></div>}
      {publishedTerms.status === "failed" && <div role="alert"><p className="py-8 text-8 text-ink-muted">Published terms couldn’t be loaded.</p><Button variant="secondary" onClick={publishedTerms.retry}>Try again</Button></div>}
      {failed && <Button variant="secondary" onClick={() => { setFailed(false); setOfferingAttempt((value) => value + 1); }}>Retry offerings</Button>}
      <p role="status" className="pt-10 text-8 leading-16 text-ink-muted">{notice || (gaps.status === "waiting" ? "Checking courses…" : gaps.status === "failed" ? "Courses couldn’t be checked. Try again." : "")}</p>
      {gaps.status === "failed" && <Button variant="secondary" onClick={() => source.setOpenTerm({ courses: [...catalog.courses], planned: [] })}>Try again</Button>}
      {gaps.status === "ready" && list.length === 0 && <p className="py-16 text-8-5 text-ink-muted">No courses close a missing line or check.</p>}
      <ul className="divide-y divide-line">
        {list.map(({ code, text }) => {
          const course = catalog.courses.find((item) => item.code === code)!;
          const sections = offered?.courses.find((item) => item.code === code)?.sections.length ?? 0;
          const offering = publishedTerms.status !== "ready" ? publishedTerms.status === "loading" ? "Loading published terms…" : "Offering details unavailable" : published
            ? offered ? sections > 0 ? `Offered · ${sections} ${sections === 1 ? "section" : "sections"}` : `Not offered in ${term}` : failed ? "Offerings couldn’t be loaded" : "Loading offerings…"
            : course.termLetters.includes(named.letter) ? `Usually offered in ${named.letter}` : "Offering not known yet";
          return <li key={code} className="py-16">
            <h3 className="text-9 leading-16 font-650">{code} · {course.title}</h3>
            <p className="pt-4 text-8 leading-16 text-ink-muted">{text}</p>
            <p className="pt-4 text-8 leading-16 text-ink-muted">{offering}</p>
            <div className="flex flex-wrap gap-8 pt-10">
              <Button size="sm" aria-label={`Plan ${code} for ${term}`} onClick={() => {
                const result = getDegreeSource().addCourse({ ...foundCourse(course), status: "planned", term });
                setNotice(result === "unsaved" ? `${code} added for this visit. Browser storage is unavailable.` : result === "added" ? `${code} planned for ${term}.` : `${code} couldn’t be added.`);
              }}>Plan for {term}</Button>
              {published && sections > 0 && <OpenInPlanner termId={termId} code={code} />}
            </div>
          </li>;
        })}
      </ul>
      {details && details.size > limit && <Button variant="secondary" onClick={() => setLimit(limit + 30)}>Show more courses</Button>}
    </SuggestFrame>
  );
}
