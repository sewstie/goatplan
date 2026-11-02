import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { X } from "@phosphor-icons/react/ssr";
import { guidePlacement, preferredPlaces, type GuideRect } from "./guidePlacement";
import { guideTarget } from "./GuideTargetOutline";
import type { GuideStep } from "./tutorialSteps";

type GuidePopoverProps = {
  step: GuideStep;
  targetId: string;
  title: string;
  body: string;
  hint?: string;
  note?: string;
  progress: { current: number; total: number };
  onClose(): void;
  finishRef: RefObject<HTMLButtonElement | null>;
  children: ReactNode;
};

/** A landmark on the page, unless it's hidden right now. */
function visibleRect(selector: string): GuideRect | undefined {
  const rect = document.querySelector(selector)?.getBoundingClientRect();
  return rect && rect.width > 0 ? rect : undefined;
}

export function GuidePopover({ step, targetId, title, body, hint, note, progress, onClose, finishRef, children }: GuidePopoverProps) {
  const box = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const phone = usePhoneViewport();
  const slot = usePhoneSlot(phone ? step : null);
  useLayoutEffect(() => {
    if (phone) return;
    function place() {
      const element = box.current;
      if (!element) return;
      const rect = guideTarget(targetId)?.getBoundingClientRect() ?? { left: 0, top: 0, width: 0, height: 0 };
      const size = element.getBoundingClientRect();
      const landmarks = {
        sidebar: visibleRect("aside"),
        calendar: visibleRect('[aria-label="Weekly schedule"]'),
        details: visibleRect('[aria-label="Course details"]'),
      };
      const blocks = Array.from(document.querySelectorAll("[data-block], [data-blocked-time]"), (block) => block.getBoundingClientRect());
      const position = guidePlacement(rect, size, { width: window.innerWidth, height: window.innerHeight }, preferredPlaces(step, targetId, rect, size, landmarks), blocks);
      element.style.left = `${position.left}px`;
      element.style.top = `${position.top}px`;
      element.style.visibility = "visible";
    }
    guideTarget(targetId)?.scrollIntoView?.({ block: "nearest" });
    place();
    const observer = new ResizeObserver(place);
    observer.observe(document.body);
    if (box.current) observer.observe(box.current);
    const mutation = new MutationObserver(place);
    mutation.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { observer.disconnect(); mutation.disconnect(); window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [step, targetId, phone]);
  useLayoutEffect(() => {
    (step === "schedules" ? finishRef.current : heading.current)?.focus({ preventScroll: !phone });
  }, [step, slot, phone, finishRef]);

  const card = <div ref={box} role="dialog" aria-labelledby="guide-heading" aria-describedby="guide-body" className={phone
    ? "guide-popover flex flex-col gap-8 rounded-guide border border-guide-line bg-surface px-16 pt-16 pb-14 shadow-guide"
    : `guide-popover invisible fixed z-20 flex max-h-[calc(100dvh-16px)] max-w-[calc(100vw-16px)] flex-col gap-8 overflow-y-auto rounded-guide border border-guide-line bg-surface px-20 pt-19 pb-16 shadow-guide ${step === "schedules" ? "w-330" : "w-280"}`}>
    <div className="flex items-center justify-between">
      <p aria-live="polite" aria-atomic="true" className="text-9 leading-13 font-600 text-accent">Getting started · {progress.current} of {progress.total}</p>
      <button type="button" aria-label="Close guide" onClick={onClose} className="flex size-13 cursor-pointer items-center justify-center text-ink"><X aria-hidden className="size-13" /></button>
    </div>
    <h2 id="guide-heading" ref={heading} tabIndex={-1} className="mt-3 text-17 leading-guide-title font-700 tracking-tight text-ink outline-none">{title}</h2>
    <p id="guide-body" className="text-11 leading-guide-body text-ink-muted">{body}</p>
    {hint && <p id="guide-hint" aria-live="polite" className="mt-2 text-10 leading-16 text-guide-hint">{hint}</p>}
    {children}
    {note && <p className="mt-5 text-8 leading-12 text-ink-muted">{note}</p>}
  </div>;

  if (!phone) return card;
  return slot ? createPortal(card, slot) : null;
}

/** On a phone the guide sits in the page, in the open screen's place for this step (`data-guide-slot`). */
function usePhoneSlot(step: GuideStep | null): Element | null {
  const [slot, setSlot] = useState<Element | null>(null);
  useLayoutEffect(() => {
    if (!step) return;
    const find = () => setSlot(document.querySelector(`[data-phone-screen]:not([hidden]) [data-guide-slot="${step}"]`));
    find();
    const observer = new MutationObserver(find);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [step]);
  return step ? slot : null;
}
