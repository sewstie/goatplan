"use client";

import { useMemo, useRef, useState, type RefObject } from "react";
import { CopySimple, ShareNetwork } from "@phosphor-icons/react/ssr";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { AnchoredPanel } from "@/components/ui/AnchoredPanel";
import { Button } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { focusWithin } from "@/components/ui/focusRing";
import { Notice } from "@/components/ui/Notice";
import { track } from "@/lib/analytics/track";
import { encodePlan } from "@/lib/share/codec";
import { shareSummary } from "@/lib/share/summary";
import { shareUrl } from "@/lib/share/url";
import { selectChosenSections, selectReadOnlyPlan, usePlannerStore } from "@/lib/store";

export const PRIVACY_MESSAGE = "Blocked-time names, My degree and course history stay private.";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-16 py-6">
      <dt className="text-8-5 leading-16 text-ink-muted">{label}</dt>
      <dd className="text-right text-8-5 leading-16 font-600">{value}</dd>
    </div>
  );
}

export function SharePanel({ id, anchor, onClose }: { id: string; anchor: RefObject<HTMLElement | null>; onClose(): void }) {
  const store = usePlannerStore();
  const phone = usePhoneViewport();
  const copyButton = useRef<HTMLButtonElement>(null);
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

  const canUseShareSheet = typeof navigator.share === "function";
  const size = phone ? "lg" : "md";

  return (
    <AnchoredPanel id={id} title="Share this schedule" anchor={anchor} onClose={onClose} initialFocus={copyButton}>
      <p className="pt-2 text-8-5 leading-16 text-ink-muted">{[termName, summary.courses].filter(Boolean).join(" · ")}</p>
      <label htmlFor="share-link" className="pt-12 pb-5 text-8-5 leading-16 font-600 text-ink-soft">Anyone with the link can view a snapshot</label>
      <div className={`flex items-center rounded-card border border-card-line bg-card-field px-11 ${focusWithin}`}>
        <input id="share-link" readOnly value={url} onFocus={(event) => event.target.select()} className="min-h-36 min-w-0 flex-1 truncate bg-transparent text-8-5 leading-16 text-ink-soft outline-none max-tablet:min-h-44" />
      </div>
      <div className="flex gap-8 pt-10 max-tablet:flex-col">
        <Button ref={copyButton} size={size} className="flex-1 max-tablet:min-h-44 max-tablet:w-full" icon={<CopySimple aria-hidden />} onClick={() => void copy()}>Copy link</Button>
        {canUseShareSheet && <Button variant="secondary" size={size} className="flex-1 max-tablet:min-h-44 max-tablet:w-full" icon={<ShareNetwork aria-hidden />} onClick={() => void shareSheet()}>Share…</Button>}
      </div>
      <p role="status" className="min-h-16 pt-4 text-8 leading-12 text-ink-muted">{status}</p>
      <Disclosure summary="What’s included" className="mt-4">
        <dl className="flex flex-col">
          <Row label="Sections & locks" value={summary.sections} />
          <Row label="Professor choices" value={summary.professors} />
          <Row label="Preferences" value={summary.preferences} />
          <Row label="Blocked times" value={summary.blocked} />
        </dl>
        <Notice tone="private" className="mt-8">{PRIVACY_MESSAGE}</Notice>
      </Disclosure>
    </AnchoredPanel>
  );
}
