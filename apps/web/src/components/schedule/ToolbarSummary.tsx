"use client";

import { useEffect, useRef, useState } from "react";
import { CircleNotch, DotsThree, Warning } from "@phosphor-icons/react/ssr";
import { useDetailsDrawer } from "@/components/shell/detailsDrawer";
import { cx } from "@/components/ui/cx";
import { useDismiss } from "@/components/ui/useDismiss";
import { ScoreChips } from "./ScoreChips";
import { useScheduleMessage } from "./useScheduleMessage";
import { useScheduleSummary } from "./useScheduleSummary";

/** The list stays mounted while folded, so it can tell when there's room again. */
function useOverflows() {
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    if (!box.current || !list.current || typeof ResizeObserver === "undefined") return;
    const check = () => setOverflows((list.current?.offsetHeight ?? 0) > (box.current?.clientHeight ?? 0));
    const observer = new ResizeObserver(check);
    observer.observe(box.current);
    observer.observe(list.current);
    return () => observer.disconnect();
  }, []);
  return { box, list, overflows };
}

/** What the shown schedule is like: badges that wrap and then fold into "⋯ details", or a warning in their place. */
export function ToolbarSummary() {
  const { text, badges, problem } = useScheduleSummary();
  const message = useScheduleMessage();
  const { box, list, overflows } = useOverflows();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const openDetails = useDetailsDrawer((state) => state.show);
  const docked = useDetailsDrawer((state) => state.docked);
  const warning = message?.tone === "warning" && !problem;
  const finding = message?.tone === "loading";
  const showBadges = !problem && !warning && !finding && badges.length > 0;
  const plainText = !problem && !warning && !finding && badges.length === 0;
  const collapsed = overflows && showBadges;
  const showDetails = open && collapsed;
  useDismiss(showDetails, root, () => setOpen(false));

  return (
    <div ref={root} className={cx("relative flex h-full min-w-0 flex-1 items-center gap-6 text-8 leading-12 text-ink-muted", collapsed && "min-w-84")}>
      {/* Whatever isn't shown word for word, so a screen reader hears all of it. */}
      <p role="status" className="sr-only">
        {!plainText && <span>{text}</span>}
        {message && <> <span>{message.title} {message.detail}</span></>}
      </p>
      {problem && (
        <p aria-hidden title={text ?? undefined} className="flex shrink-0 items-center gap-5 font-600 whitespace-nowrap text-warning-ink">
          <Warning aria-hidden className="size-13 shrink-0" />
          No schedule fits.
        </p>
      )}
      {warning && (
        <p aria-hidden title={message.detail} className="flex shrink-0 items-center gap-5 font-600 whitespace-nowrap text-warning-ink">
          <Warning aria-hidden className="size-13 shrink-0" />
          {message.title}
        </p>
      )}
      {finding && (
        <p aria-hidden className="flex shrink-0 items-center gap-5 whitespace-nowrap">
          <CircleNotch aria-hidden className="size-13 shrink-0 motion-safe:animate-spin" />
          {message.title}
        </p>
      )}
      {plainText && <p title={text ?? undefined} className="min-w-0">{text}</p>}
      {problem && !docked && (
        <button type="button" onClick={() => openDetails()} className="shrink-0 cursor-pointer rounded-badge font-600 text-accent underline underline-offset-2">See how to fix it</button>
      )}
      <div ref={box} className={cx("h-full min-w-0 flex-1", !showBadges && "hidden", collapsed && "invisible absolute inset-0")}>
        <div ref={list} className="flex min-h-full items-center">
          <ScoreChips chips={badges} short />
        </div>
      </div>
      {collapsed && (
        <>
          <button type="button" aria-expanded={showDetails} onClick={() => setOpen(!open)} className="flex min-h-28 shrink-0 cursor-pointer items-center gap-4 rounded-row px-6 font-600 text-ink-soft hover:bg-surface-selected">
            <DotsThree aria-hidden weight="bold" className="size-14" />
            details
          </button>
          {showDetails && (
            <div className="absolute top-full left-0 z-30 mt-2 w-280 max-w-[80vw] rounded-card border border-line-popover bg-surface p-10 shadow-popover">
              {text && <p className="pb-6">{text}</p>}
              <ScoreChips chips={badges} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
