"use client";

import { useRef, useState, type RefObject } from "react";
import { DownloadSimple } from "@phosphor-icons/react/ssr";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { AnchoredPanel } from "@/components/ui/AnchoredPanel";
import { Button } from "@/components/ui/Button";
import { CheckField } from "@/components/ui/CheckField";
import { Disclosure } from "@/components/ui/Disclosure";
import { Notice } from "@/components/ui/Notice";
import { track } from "@/lib/analytics/track";
import { buildIcs, icsFileName } from "@/lib/calendar/ics";
import { exportLine, exportSummary } from "@/lib/calendar/summary";
import { termCalendar } from "@/lib/calendar/term-calendar";
import { selectViewedSchedule, usePlannerStore } from "@/lib/store";

function download(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function DetailList({ title, items }: { title: string; items: readonly string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="pt-8">
      <p className="text-8 leading-14-4 font-650">{title}</p>
      <ul className="text-8 leading-14-4 text-ink-muted">{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </div>
  );
}

export function ExportPanel({ id, anchor, onClose }: { id: string; anchor: RefObject<HTMLElement | null>; onClose(): void }) {
  const store = usePlannerStore();
  const phone = usePhoneViewport();
  const state = store.getState();
  const schedule = selectViewedSchedule(state);
  const term = state.term?.term;
  const [calendar] = useState(() => (term ? termCalendar(term.id) : null));
  const [without, setWithout] = useState(true);
  const [downloaded, setDownloaded] = useState(false);
  const downloadButton = useRef<HTMLButtonElement>(null);
  const againButton = useRef<HTMLButtonElement>(null);
  if (!schedule || !term) return null;

  const summary = exportSummary(schedule, term, calendar);
  const hasEvents = summary.sections.length > 0;
  const fileName = icsFileName(term.id);
  const size = phone ? "lg" : "md";

  function save() {
    download(fileName, buildIcs(schedule!, term!, new Date(), calendar));
    track("ics_exported");
    setDownloaded(true);
    setTimeout(() => againButton.current?.focus());
  }

  return (
    <AnchoredPanel id={id} title="Export to calendar" anchor={anchor} onClose={onClose} initialFocus={downloadButton}>
      <p className="pt-2 text-8-5 leading-16 text-ink-muted">{hasEvents ? exportLine(summary) : "None of the classes in this schedule have dates and times to add."}</p>

      {downloaded ? (
        <>
          <p role="status" className="pt-12 text-10 leading-16 font-650">Downloaded ✓ <span className="font-510 text-ink-muted">{fileName}</span></p>
          <ul className="list-disc pt-6 pl-16 text-8-5 leading-16 text-ink-muted">
            <li>Apple Calendar or Outlook: open the file.</li>
            <li>Google Calendar: Settings, then Import &amp; export.</li>
            <li>Export again if your sections change.</li>
          </ul>
          <Button ref={againButton} variant="secondary" size={size} className="mt-12 w-full max-tablet:min-h-44" icon={<DownloadSimple aria-hidden />} onClick={save}>Download again</Button>
        </>
      ) : (
        <>
          {!calendar && (
            <>
              <Notice tone="warning" title="WPI calendar information is unavailable" className="mt-12">
                Holidays and alternate weekday schedules may be missing.
              </Notice>
              <CheckField
                className="mt-12"
                label="Download without WPI calendar adjustments"
                description="I’ll check holidays and alternate schedules myself."
                checked={without}
                onChange={(event) => setWithout(event.target.checked)}
              />
            </>
          )}
          <Button
            ref={downloadButton}
            size={size}
            className="mt-12 w-full max-tablet:min-h-44"
            icon={<DownloadSimple aria-hidden />}
            disabled={!hasEvents || (!calendar && !without)}
            onClick={save}
          >
            {calendar ? "Download .ics" : "Download without adjustments"}
          </Button>
        </>
      )}

      <Disclosure summary="Details" className="mt-12">
        {hasEvents && (
          <ul aria-label="Dates for each section">
            {summary.sections.map((section) => (
              <li key={section.id} className="flex items-start justify-between gap-12 border-b border-line py-6 last:border-b-0">
                <div className="min-w-0">
                  <p className="text-8 leading-14-4 font-650">{section.name}</p>
                  <p className="text-8 leading-14-4 text-ink-muted">{section.times}</p>
                </div>
                <span className="shrink-0 text-8 leading-14-4 text-ink-muted">{section.dates}</span>
              </li>
            ))}
          </ul>
        )}
        {summary.untimed.length > 0 && <p className="pt-8 text-8 leading-14-4 text-ink-muted">No set time, so left out: {summary.untimed.join(", ")}</p>}
        <DetailList title="No classes" items={summary.holidays} />
        <DetailList title="Schedule swaps" items={summary.swaps} />
        {summary.notes.map((note) => <p key={note} className="pt-8 text-8 leading-14-4 text-ink-muted">{note}</p>)}
        <p className="pt-8 text-8 leading-14-4 text-ink-muted">Times are New York time and follow daylight saving. Blocked times stay out of the file.</p>
      </Disclosure>
    </AnchoredPanel>
  );
}
