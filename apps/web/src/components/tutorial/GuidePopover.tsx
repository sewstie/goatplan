import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { X } from "@phosphor-icons/react/ssr";
import { GuideDots } from "./GuideDots";
import { guidePlacement, preferredPlaces, type GuideRect } from "./guidePlacement";
import { guideTarget } from "./GuideTargetOutline";
import type { GuideStep } from "./tutorialSteps";

type GuidePopoverProps = {
  step: GuideStep;
  targetId: string;
  title: string;
  body: string;
  hint?: string;
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

export function GuidePopover({ step, targetId, title, body, hint, progress, onClose, finishRef, children }: GuidePopoverProps) {
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
    ? "guide-popover flex flex-col gap-8 rounded-guide border border-guide-line bg-surface p-20 shadow-guide"
    : "guide-popover invisible fixed z-20 flex w-280 max-h-[calc(100dvh-16px)] max-w-[calc(100vw-16px)] flex-col gap-8 overflow-y-auto rounded-guide border border-guide-line bg-surface p-24 shadow-guide"}>
    <div className="flex items-center justify-between">
      <GuideDots {...progress} />
      <button type="button" aria-label="Close guide" onClick={onClose} className="-m-6 flex size-26 cursor-pointer items-center justify-center rounded-control text-ink-muted hover:text-ink"><X aria-hidden className="size-14" /></button>
    </div>
    <h2 id="guide-heading" ref={heading} tabIndex={-1} className="mt-6 text-17 font-600 text-ink outline-none">{title}</h2>
    <p id="guide-body" className="text-10 text-ink-muted">{body}</p>
    {hint && <p id="guide-hint" aria-live="polite" className="text-9 text-ink-muted">{hint}</p>}
    {children}
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
