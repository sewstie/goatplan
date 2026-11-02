"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, CopySimple, ShareNetwork } from "@phosphor-icons/react/ssr";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { PageDialog } from "@/components/ui/PageDialog";
import { track } from "@/lib/analytics/track";
import { encodePlan } from "@/lib/share/codec";
import { shareSummary } from "@/lib/share/summary";
import { shareUrl } from "@/lib/share/url";
import { selectChosenSections, selectReadOnlyPlan, usePlannerStore } from "@/lib/store";

export const PRIVACY_MESSAGE = "Blocked-time names, My degree and course history stay private.";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-16 py-9">
      <dt className="text-8-5 leading-17 text-ink-muted">{label}</dt>
      <dd className="text-right text-8-5 leading-17 font-600">{value}</dd>
    </div>
  );
}

export function ShareDialog({ onClose }: { onClose(): void }) {
  const store = usePlannerStore();
  const phone = usePhoneViewport();
  const [status, setStatus] = useState("");

  const { url, summary, termName } = useMemo(() => {
    const state = store.getState();
    const viewed = selectReadOnlyPlan(state);
    const source = viewed ?? state;
    const chosen = viewed ? Object.fromEntries(viewed.schedule.map((course) => [course.code, course.sections.map((section) => section.id)])) : selectChosenSections(state);
    const term = viewed?.term ?? state.terms.find((item) => item.id === state.termId);
    return {
      url: source.termId ? shareUrl(window.location.href, encodePlan({ ...source, termId: source.termId, chosen })) : "",
      summary: shareSummary(source),
      termName: term ? `${term.name} ${term.year}` : "",
    };
  }, [store]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Link copied.");
    } catch {
      setStatus("Your browser wouldn’t copy it. Select the link and copy it yourself.");
    }
    track("share_link_created");
  }

  async function shareSheet() {
    try {
      await navigator.share({ title: "GoatPlan schedule", text: PRIVACY_MESSAGE, url });
      track("share_link_created");
      setStatus("Link shared.");
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) await copy();
    }
  }

  const canUseShareSheet = phone && typeof navigator.share === "function";

  return (
    <PageDialog
      open
      onClose={onClose}
      title="Share this schedule"
      description="Send this schedule without sharing your personal history."
      breadcrumb={`Planner / ${termName}`}
      footer={
        phone ? (
          <div className="flex w-full flex-col gap-8">
            {canUseShareSheet && <Button fullWidth size="lg" className="min-h-44" icon={<ShareNetwork aria-hidden />} onClick={() => void shareSheet()}>Share…</Button>}
            <Button variant={canUseShareSheet ? "secondary" : "primary"} fullWidth size="lg" className="min-h-44" icon={<CopySimple aria-hidden />} onClick={() => void copy()}>Copy link</Button>
          </div>
        ) : (
          <Button variant="secondary" size="md" onClick={onClose}>Done</Button>
        )
      }
    >
      <div className="mt-16 flex items-center gap-14 rounded-tile border border-card-line bg-card-field px-17 py-19">
        <span aria-hidden className="flex size-38 shrink-0 items-center justify-center rounded-card bg-accent-soft text-ink [&_svg]:size-20"><CalendarCheck /></span>
        <div className="min-w-0">
          <p className="text-10 leading-17-5 font-600">{termName}</p>
          <p className="text-8-5 leading-17 text-ink-muted">{summary.courses}</p>
        </div>
      </div>
      <dl className="flex flex-col pt-12">
        <Row label="Sections & locks" value={summary.sections} />
        <Row label="Professor choices" value={summary.professors} />
        <Row label="Preferences" value={summary.preferences} />
        <Row label="Blocked times" value={summary.blocked} />
      </dl>
      <Notice tone="private" className="mt-14">{PRIVACY_MESSAGE}</Notice>
      <label htmlFor="share-link" className="pt-18 pb-7 text-8-5 leading-17 font-600 text-ink-soft">Anyone with the link can view a snapshot</label>
      <div className="flex items-center gap-8 rounded-card border border-card-line bg-card-field py-6 pr-6 pl-13 has-[input:focus-visible]:border-choice-line has-[input:focus-visible]:shadow-field-focus">
        <input id="share-link" readOnly value={url} onFocus={(event) => event.target.select()} className="min-h-36 min-w-0 flex-1 truncate bg-transparent text-8-5 leading-16 text-ink-soft outline-none" />
        <Button size="sm" className="hidden min-h-34 tablet:inline-flex" icon={<CopySimple aria-hidden />} onClick={() => void copy()}>Copy</Button>
      </div>
      <p role="status" className="min-h-16 pt-4 text-8 leading-12 text-ink-muted">{status}</p>
    </PageDialog>
  );
}
