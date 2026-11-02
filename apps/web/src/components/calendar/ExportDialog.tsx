"use client";

import { useState, type ReactNode } from "react";
import { ArrowClockwise, CalendarCheck, CheckCircle, DownloadSimple } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { CheckField } from "@/components/ui/CheckField";
import { Notice } from "@/components/ui/Notice";
import { PageDialog } from "@/components/ui/PageDialog";
import { track } from "@/lib/analytics/track";
import { buildIcs, icsFileName } from "@/lib/calendar/ics";
import { exportSummary } from "@/lib/calendar/summary";
import { termCalendar, type TermCalendar } from "@/lib/calendar/term-calendar";
import { selectViewedSchedule, usePlannerStore } from "@/lib/store";

const SMALL_PRINT = "Only classes are exported. Personal blocked times are excluded. Sections with no set time are listed as notes, without timed events.";

function download(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Adjustment({ title, text, status }: { title: string; text: ReactNode; status: string }) {
  return (
    <li className="flex items-center justify-between gap-12 border-b border-line py-12 last:border-b-0">
      <div className="min-w-0">
        <p className="flex items-center gap-10 text-8-5 leading-16 font-600"><CheckCircle aria-hidden className="size-16 shrink-0" />{title}</p>
        <p className="pt-5 text-8 leading-14-4 text-ink-muted">{text}</p>
      </div>
      <span className="shrink-0 text-8 leading-12 text-ink-muted">{status}</span>
    </li>
  );
}

export function ExportDialog({ onClose }: { onClose(): void }) {
  const store = usePlannerStore();
  const state = store.getState();
  const schedule = selectViewedSchedule(state);
  const term = state.term?.term;
  const [calendar, setCalendar] = useState<TermCalendar | null>(() => (term ? termCalendar(term.id) : null));
  const [without, setWithout] = useState(true);
  const [downloaded, setDownloaded] = useState(false);
  if (!schedule || !term) return null;

  const summary = exportSummary(schedule, term, calendar);
  const hasEvents = summary.sections.length > 0;
  const fileName = icsFileName(term.id);
  const termName = `${term.name} ${term.year}`;

  function save() {
    download(fileName, buildIcs(schedule!, term!, new Date(), calendar));
    track("ics_exported");
    setDownloaded(true);
  }

  if (downloaded) {
    return (
      <PageDialog
        open
        onClose={onClose}
        title="Calendar exported"
        breadcrumb={`Planner / ${termName}`}
        footer={
          <>
            <Button variant="secondary" size="md" icon={<DownloadSimple aria-hidden />} onClick={save}>Download again</Button>
            <Button size="md" onClick={onClose}>Done</Button>
          </>
        }
      >
        <div className="flex flex-col items-center pt-12 text-center">
          <CheckCircle aria-hidden className="size-40" />
          <p className="pt-14 text-14 leading-22 font-650">Your calendar file is ready</p>
          <p className="pt-6 text-8-5 leading-16 text-ink-muted">Import this file into your calendar app.</p>
        </div>
        <div className="mt-18 flex items-center gap-14 rounded-tile border border-card-line bg-card-field px-19 py-16">
          <CalendarCheck aria-hidden className="size-26 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-8-5 leading-17 font-600">{fileName}</p>
            <p className="text-8 leading-14-4 text-ink-muted">Classes, rooms, instructors and sections</p>
          </div>
        </div>
        <Notice title="A snapshot of this schedule" className="mt-18">Export again if your sections or meeting times change.</Notice>
      </PageDialog>
    );
  }

  return (
    <PageDialog
      open
      onClose={onClose}
      title="Export to calendar"
      description="Add your classes to Apple Calendar, Google Calendar or Outlook."
      breadcrumb={`Planner / ${termName}`}
      footer={
        calendar ? (
          <>
            <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
            <Button size="md" icon={<DownloadSimple aria-hidden />} disabled={!hasEvents} onClick={save}>Download .ics</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" size="md" icon={<ArrowClockwise aria-hidden />} onClick={() => setCalendar(termCalendar(term.id))}>Try again</Button>
            <Button size="md" icon={<DownloadSimple aria-hidden />} disabled={!hasEvents || !without} onClick={save}>Download without adjustments</Button>
          </>
        )
      }
    >
      <div className="mt-20 flex items-center gap-14 rounded-tile border border-card-line bg-card-field px-17 py-19">
        <span aria-hidden className="flex size-38 shrink-0 items-center justify-center rounded-card bg-accent-soft [&_svg]:size-20"><CalendarCheck /></span>
        <div className="min-w-0">
          <p className="text-10 leading-17-5 font-600">{term.name} · {summary.termDates}</p>
          <p className="text-8-5 leading-17 text-ink-muted">America/New_York · local class times</p>
        </div>
      </div>
      <section aria-label="Dates for each section" className="mt-6 rounded-tile border border-card-line px-17 pt-22 pb-10">
        <h3 className="pb-8 text-8-5 leading-17 font-650">Dates for each section</h3>
        {hasEvents ? (
          <ul>
            {summary.sections.map((section) => (
              <li key={section.id} className="flex items-center justify-between gap-12 border-b border-line py-12 last:border-b-0">
                <div className="min-w-0">
                  <p className="text-8 leading-16 font-650">{section.name}</p>
                  <p className="pt-3 text-8 leading-14-4 text-ink-muted">{section.times}</p>
                </div>
                <span className="shrink-0 text-8 leading-12 text-ink-muted">{section.dates}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pb-12 text-8-5 leading-16 text-ink-muted">None of the classes in this schedule have dates and times to add.</p>
        )}
        {summary.untimed.length > 0 && (
          <p className="border-t border-line py-12 text-8 leading-14-4 text-ink-muted">No set time, so left out: {summary.untimed.join(", ")}</p>
        )}
      </section>
      {calendar ? (
        <ul className="px-4 pt-8">
          {summary.holidays && <Adjustment title="Holidays & no-class days" text={summary.holidays} status="Applied" />}
          {summary.swaps && <Adjustment title="Alternate weekday schedule" text={summary.swaps} status="Applied" />}
          <Adjustment title="Daylight saving" text="Local class times stay the same" status="Handled" />
        </ul>
      ) : (
        <>
          <Notice tone="warning" title="WPI calendar information is unavailable" className="mt-6">
            We can export recurring class times, but holidays, breaks and alternate weekday schedules may be missing.
          </Notice>
          <CheckField
            className="mt-24 mb-8"
            label="Download without WPI calendar adjustments"
            description="I’ll check holidays and alternate schedules myself."
            checked={without}
            onChange={(event) => setWithout(event.target.checked)}
          />
        </>
      )}
      {summary.notes.map((note) => <p key={note} className="pt-8 text-8 leading-14-4 text-ink-muted">{note}</p>)}
      <p className="pt-12 text-8-5 leading-17 text-ink-muted">{SMALL_PRINT}</p>
    </PageDialog>
  );
}
