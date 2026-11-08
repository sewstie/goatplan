"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkle } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { DrawerFrame } from "@/components/ui/Drawer";
import { Notice } from "@/components/ui/Notice";
import { loadTerm } from "@/lib/data/load";
import { EngineClient, getEngineClient } from "@/lib/engine";
import { compareTerms, getDegreeSource, nextTerm, parseTerm, termLong, type DegreeSnapshot, type HistoryCourse } from "@/lib/degree";
import { createRecommendationAudit } from "@/lib/degree/recommendations/audit";
import { applyRecommendation } from "@/lib/degree/recommendations/apply";
import { recommend, type Recommendation } from "@/lib/degree/recommendations/planner";
import { defaultRecommendationTerm, recommendationTerms } from "@/lib/degree/recommendations/terms";
import { termId, type OfferingInput } from "@/lib/degree/recommendations/offerings";
import { createScheduleCheck } from "@/lib/degree/recommendations/schedules";
import { useCourseCatalog } from "./useCourseCatalog";
import { useCurrentTerm } from "./useCurrentTerm";
import { usePublishedTerms } from "./usePublishedTerms";
import { termChoices } from "./termChoices";
import { reservationSnapshot, useRecommendationReservations } from "./useRecommendationReservations";
import { OpenInPlanner } from "./OpenInPlanner";
import { COURSE_CREDITS, NextTermsSettings } from "./NextTermsSettings";
import { HowSuggestionsWork } from "./HowSuggestionsWork";
import { SuggestionChoices } from "./SuggestionChoices";
import { SuggestedTermCard } from "./SuggestedTermCard";

type Preview = { result: Recommendation; key: string; shape: string; history: DegreeSnapshot["history"]; selected: string[]; published: string[] };

export function NextTermsPanel({ degree, startYear, blocks, onClose }: { degree: DegreeSnapshot; startYear: number; blocks: Record<string, string>; onClose(): void }) {
  const catalog = useCourseCatalog();
  const published = usePublishedTerms();
  const current = useCurrentTerm();
  const { load: loadCatalog } = catalog;
  const choices = termChoices(startYear).flatMap((item) => { const term = parseTerm(item.value); return term && term.letter !== "E" && term.year <= 2030 ? [term] : []; });
  const [chosenStart, setStart] = useState("");
  const [today] = useState(() => new Date());
  const defaultStart = published.status === "ready" ? defaultRecommendationTerm(choices, today, published.terms) : null;
  const start = chosenStart || (defaultStart ? termLong(defaultStart) : "");
  const reservations = useRecommendationReservations(blocks);
  const [count, setCount] = useState("1");
  const [load, setLoad] = useState("3");
  const cap = Number(load) * COURSE_CREDITS;
  const [kept, setKept] = useState<HistoryCourse[]>([]);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [confirmations, setConfirmations] = useState<string[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const sequence = useRef(0);
  const suggestButton = useRef<HTMLButtonElement>(null);
  const shapeKey = JSON.stringify([degree.history, degree.selectedSheetId, degree.sheet, startYear, reservations.blocks, reservations.revision, start, count, cap, kept, confirmations, catalog.courses, published.status, published.terms]);
  const key = JSON.stringify([shapeKey, excluded]);
  const latestKey = useRef(key);
  useEffect(() => { latestKey.current = key; }, [key]);
  useEffect(() => { void loadCatalog(); }, [loadCatalog]);
  useEffect(() => () => { sequence.current++; }, []);
  const stale = preview !== null && (preview.shape !== shapeKey || preview.history !== degree.history);
  const canGenerate = catalog.ready && published.status === "ready" && degree.audit.status === "ready";
  const checking = catalog.ready && published.status === "ready" && degree.audit.status === "waiting";

  async function generate() {
    if (busy) return;
    const asked = ++sequence.current;
    const askedKey = key;
    const askedShape = shapeKey;
    setBusy(true);
    setNotice("Checking your sheet, background and offerings…");
    let timetables: EngineClient | null = null;
    try {
      if (published.status !== "ready" || !catalog.ready || !degree.sheet || degree.selectedSheetId !== "cs-2030") throw new Error("Wait for the CS sheet, catalog and terms to load, then try again.");
      const named = parseTerm(start);
      if (!named) throw new Error("Choose a starting term.");
      if (compareTerms(named, current) <= 0) throw new Error(`Pick a term after ${termLong(current)}.`);
      const terms = recommendationTerms(choices, named, Number(count));
      const offerings: Record<string, OfferingInput> = {};
      await Promise.all(terms.map(async (term) => {
        const id = termId(term);
        if (!published.terms.some((item) => item.id === id)) { offerings[id] = { status: "unpublished" }; return; }
        try { offerings[id] = { status: "published", file: await loadTerm(id) }; }
        catch { offerings[id] = { status: "failed" }; }
      }));
      const cancelled = () => reservationSnapshot() !== reservations.revision || asked !== sequence.current || askedKey !== latestKey.current || getDegreeSource().getSnapshot().history !== degree.history;
      if (cancelled()) return;
      // Its own engine, so loading terms here never swaps the schedule planner’s term.
      timetables = new EngineClient();
      const result = await recommend({ history: degree.history, sheet: degree.sheet, catalog: catalog.courses, terms, cap, offerings, kept, excluded, confirmations, reserved: reservations.blocks, cancelled }, createRecommendationAudit(getEngineClient(), degree.sheet), createScheduleCheck(timetables));
      if (cancelled()) return;
      if (terms.length < Number(count)) result.issues.unshift("The plan grid ends here, so there are fewer terms than you asked for.");
      setPreview({ result, key: askedKey, shape: askedShape, history: degree.history, selected: result.terms.flatMap((term) => term.additions.map((choice) => choice.course.code)), published: Object.entries(offerings).filter(([, value]) => value.status === "published").map(([id]) => id) });
      setNotice(Object.values(offerings).some((value) => value.status === "failed") ? "Some terms couldn’t be loaded. Suggest again to retry." : "Suggestions ready. Nothing is saved until you add them.");
    } catch (error) { if (asked === sequence.current && askedKey === latestKey.current) setNotice(error instanceof Error ? error.message : "Suggestions couldn’t be made. Try again."); }
    finally { timetables?.dispose(); if (asked === sequence.current) { setBusy(false); if (askedKey !== latestKey.current) setNotice("Your plan or settings changed. Suggest again to update."); } }
  }

  const choiceFor = (code: string) => preview?.result.terms.flatMap((row) => [...row.additions, ...row.alternatives]).find((choice) => choice.course.code === code);
  function keep(code: string, credits?: number) {
    const choice = choiceFor(code);
    if (!choice) return;
    setKept((values) => values.some((course) => course.code === code) ? values.filter((course) => course.code !== code) : [...values, { ...choice.course, credits: credits ?? choice.course.credits }]);
    setExcluded((values) => values.filter((item) => item !== code));
  }
  function exclude(code: string) {
    setPreview((value) => value ? { ...value, selected: value.selected.filter((item) => item !== code) } : value);
    setExcluded((values) => [...new Set([...values, code])]);
    setKept((values) => values.filter((course) => course.code !== code));
  }
  function select(code: string, checked: boolean) {
    setPreview((value) => value ? { ...value, selected: checked ? [...value.selected, code] : value.selected.filter((item) => item !== code) } : value);
  }
  function confirm(note: string, checked: boolean) { setConfirmations((values) => checked ? [...values, note] : values.filter((value) => value !== note)); }
  function add() {
    suggestButton.current?.focus();
    if (!preview || stale || reservationSnapshot() !== reservations.revision) { setNotice("Your plan or settings changed. Suggest again before adding courses."); return; }
    const source = getDegreeSource();
    setNotice(applyRecommendation(source, preview.history, preview.result.terms.flatMap((row) => row.additions.filter((choice) => preview.selected.includes(choice.course.code)).map((choice) => choice.course))));
    if (source.getSnapshot().history !== preview.history) setPreview(null);
  }
  function chooseStart(value: string) {
    const named = parseTerm(value);
    setStart(named?.letter === "E" ? termLong(nextTerm(named)) : value);
  }
  function refocus(change: () => void) {
    suggestButton.current?.focus();
    change();
  }

  const status = notice || (catalog.failed ? "The course catalog couldn’t be loaded." : !catalog.ready ? "Loading course catalog…" : published.status === "failed" ? "Terms couldn’t be loaded." : published.status !== "ready" ? "Loading published terms…" : degree.audit.status === "waiting" ? "Checking degree history…" : degree.audit.status === "failed" ? "Your degree check couldn’t load. Close this panel and retry it." : "");
  const picked = preview ? preview.result.terms.flatMap((row) => row.additions).filter((choice) => preview.selected.includes(choice.course.code)).length : 0;
  const footer = preview && (
    <div className="flex w-full items-center justify-between gap-12">
      <p className="text-8-5 leading-13 text-ink-muted">{stale ? "Out of date" : `${picked} selected`}</p>
      <Button disabled={stale || busy || picked === 0} onClick={add}>{picked === 0 ? "Add courses to my plan" : picked === 1 ? "Add 1 course to my plan" : `Add ${picked} courses to my plan`}</Button>
    </div>
  );

  return (
    <DrawerFrame title="Suggest next terms" onClose={onClose} footer={footer}>
      <div className="flex flex-col gap-14">
        <p className="text-9 leading-16 text-ink-muted">Course ideas for your next terms, based on your CS sheet and what you’ve taken. Nothing is saved until you add them.</p>
        <NextTermsSettings start={start} onStart={chooseStart} count={count} onCount={setCount} load={load} onLoad={setLoad} startYear={startYear} current={current} />
        <SuggestionChoices kept={kept} excluded={excluded} confirmations={confirmations}
          unkeep={(code) => refocus(() => setKept((values) => values.filter((course) => course.code !== code)))}
          restore={(code) => refocus(() => setExcluded((values) => values.filter((item) => item !== code)))}
          unconfirm={(note) => refocus(() => confirm(note, false))}
          clear={() => refocus(() => { setKept([]); setExcluded([]); setConfirmations([]); })} />
        {/* While the degree check reruns, the button stays focusable, so focus put here after adding isn't lost. */}
        <Button ref={suggestButton} icon={<Sparkle aria-hidden />} fullWidth disabled={!canGenerate && !checking} aria-disabled={busy || checking || undefined} onClick={() => { if (canGenerate && !busy) void generate(); }}>{busy ? "Finding courses…" : preview ? "Suggest again" : "Suggest courses"}</Button>
        {(catalog.failed || published.status === "failed") && (
          <div className="flex flex-wrap gap-8">
            {catalog.failed && <Button size="sm" variant="secondary" onClick={() => void catalog.load()}>Retry catalog</Button>}
            {published.status === "failed" && <Button size="sm" variant="secondary" onClick={published.retry}>Retry terms</Button>}
          </div>
        )}
        <p role="status" aria-live="polite" className="-mt-6 text-8-5 leading-15 text-ink-muted empty:hidden">{stale ? "" : status}</p>
        {preview && stale && (
          <div role="alert"><Notice tone="warning" title="These suggestions are out of date">Your settings or plan changed. Suggest again before adding courses.</Notice></div>
        )}
        {preview && preview.result.terms.map((row) => (
          <SuggestedTermCard key={termId(row.term)} row={row} cap={cap} selected={preview.selected} keptCodes={kept.map((course) => course.code)} select={select} keep={keep} exclude={exclude} confirmations={confirmations} onConfirm={confirm}
            planner={preview.published.includes(termId(row.term)) && !stale ? <OpenInPlanner termId={termId(row.term)} /> : undefined} />
        ))}
        {preview && preview.result.issues.length > 0 && (
          <Disclosure summary={`Still open on your sheet · ${preview.result.issues.length}`}>
            <ul className="flex list-disc flex-col gap-4 pl-16 text-8-5 leading-15 text-ink-muted">{preview.result.issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>
          </Disclosure>
        )}
        <HowSuggestionsWork />
      </div>
    </DrawerFrame>
  );
}
