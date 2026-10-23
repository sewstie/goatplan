import { useLayoutEffect, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react/ssr";
import { guidePlacement } from "./guidePlacement";
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
  children: ReactNode;
};

export function GuidePopover({ step, targetId, title, body, hint, progress, onClose, children }: GuidePopoverProps) {
  const box = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    function place() {
      const element = box.current;
      if (!element) return;
      const target = guideTarget(targetId);
      const rect = target?.getBoundingClientRect() ?? { left: 0, top: 0, width: 0, height: 0 };
      const size = element.getBoundingClientRect();
      const sidebar = document.querySelector("aside")?.getBoundingClientRect();
      const panel = target?.closest("aside")?.getBoundingClientRect();
      const calendar = document.querySelector('[aria-label="Weekly schedule"]')?.getBoundingClientRect();
      const preferred = step === "professor"
        ? { left: (panel?.left ?? rect.left) - size.width - 12, top: rect.top - 82 }
        : step === "availability"
          ? { left: rect.left + 18, top: rect.top + rect.height + 74 }
          : step === "schedules"
            ? { left: (calendar?.left ?? 250) + 24, top: (calendar?.bottom ?? window.innerHeight) - size.height - 22 }
            : { left: (sidebar?.right ?? rect.left + rect.width + 16) + 12, top: 178 };
      const position = guidePlacement(rect, size, { width: window.innerWidth, height: window.innerHeight }, preferred);
      element.style.left = `${position.left}px`;
      element.style.top = `${position.top}px`;
      element.style.visibility = "visible";
    }
    place();
    const observer = new ResizeObserver(place);
    observer.observe(document.body);
    if (box.current) observer.observe(box.current);
    const mutation = new MutationObserver(place);
    mutation.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { observer.disconnect(); mutation.disconnect(); window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [step, targetId]);
  useLayoutEffect(() => { if (step !== "schedules") heading.current?.focus({ preventScroll: true }); }, [step]);

  return <div ref={box} role="dialog" aria-labelledby="guide-heading" aria-describedby="guide-body" className={`guide-popover invisible fixed z-20 flex max-h-[calc(100dvh-16px)] max-w-[calc(100vw-16px)] flex-col gap-8 overflow-y-auto rounded-guide border border-guide-line bg-surface px-20 pt-19 pb-16 shadow-guide ${step === "schedules" ? "w-330" : "w-292"}`}>
    <div className="flex items-center justify-between">
      <p aria-live="polite" aria-atomic="true" className="text-9 leading-13 font-600 text-accent">Getting started · {progress.current} of {progress.total}</p>
      <button type="button" aria-label="Close guide" onClick={onClose} className="flex size-13 cursor-pointer items-center justify-center text-ink"><X aria-hidden className="size-13" /></button>
    </div>
    <h2 id="guide-heading" ref={heading} tabIndex={-1} className="mt-3 text-17 leading-[22.1px] font-700 tracking-[-0.4px] text-ink outline-none">{title}</h2>
    <p id="guide-body" className="text-11 leading-[19.3px] text-ink-muted">{body}</p>
    {hint && <p id="guide-hint" className="mt-2 text-10 leading-16 text-guide-hint">{hint}</p>}
    {children}
    <p className="mt-5 text-8 leading-12 text-ink-muted">Your choices stay in your plan.</p>
  </div>;
}
