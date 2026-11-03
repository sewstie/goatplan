"use client";

import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { CircleNotch, DotsThree, Warning } from "@phosphor-icons/react/ssr";
import { useDismiss } from "@/components/ui/useDismiss";
import { wrappedHeight } from "./chipRows";
import { ScoreChips } from "./ScoreChips";
import { useScheduleMessage } from "./useScheduleMessage";
import { useScheduleSummary } from "./useScheduleSummary";

const GAP_X = 4;
const GAP_Y = 2;

/** Works the rows out from each chip's size, which is the same folded or not, so it can't flip back and forth. */
function useOverflows() {
  const root = useRef<HTMLDivElement>(null);
  const chips = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const check = useEffectEvent(() => {
    if (!root.current || !chips.current) return;
    const sized = [...chips.current.querySelectorAll("li")].map((element) => ({ width: element.offsetWidth, height: element.offsetHeight })).filter((size) => size.width > 0);
    setOverflows(wrappedHeight(sized, root.current.clientWidth, GAP_X, GAP_Y) > root.current.clientHeight);
  });
  useLayoutEffect(() => check());
  useEffect(() => {
    if (!root.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => check());
    observer.observe(root.current);
    void document.fonts?.ready.then(() => check());
    return () => observer.disconnect();
  }, []);
  return { rootRef: root, chips, overflows };
}

/** What the shown schedule is like: badges that wrap and then fold into "⋯ details", or a warning in their place. */
export function ToolbarSummary() {
  const { text, badges, problem } = useScheduleSummary();
  const message = useScheduleMessage();
  const { rootRef, chips, overflows } = useOverflows();
  const [open, setOpen] = useState(false);
  const warning = message?.tone === "warning" && !problem;
  const finding = message?.tone === "loading";
  const showBadges = !problem && !warning && !finding && badges.length > 0;
  const plainText = !problem && !warning && !finding && badges.length === 0;
  const collapsed = overflows && showBadges;
  const showDetails = open && collapsed;
  useDismiss(showDetails, rootRef, () => setOpen(false));

  return (
    <div ref={rootRef} className="relative flex h-full min-w-0 flex-1 flex-wrap content-center items-center gap-x-4 gap-y-2 text-8 leading-12 text-ink-muted">
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
      {/* Folded chips stay mounted, out of the flow, to be measured. */}
      <div ref={chips} className={!showBadges ? "hidden" : collapsed ? "invisible absolute top-0 left-0 flex w-max" : "contents"}>
        <ScoreChips chips={badges} short flat />
      </div>
      {collapsed && (
        <button type="button" aria-expanded={showDetails} onClick={() => setOpen(!open)} className="flex min-h-24 shrink-0 cursor-pointer items-center gap-4 rounded-row px-6 font-600 whitespace-nowrap text-ink-soft hover:bg-surface-selected">
          <DotsThree aria-hidden weight="bold" className="size-14" />
          details
        </button>
      )}
      {showDetails && (
        <div className="absolute top-full left-0 z-30 mt-2 w-280 max-w-[80vw] rounded-card border border-line-popover bg-surface p-10 shadow-popover">
          {text && <p className="pb-6">{text}</p>}
          <ScoreChips chips={badges} />
        </div>
      )}
    </div>
  );
}
