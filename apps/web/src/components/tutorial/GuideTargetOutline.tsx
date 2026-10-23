import { useLayoutEffect, useRef } from "react";

export function guideTarget(id: string): HTMLElement | null {
  const target = document.getElementById(id);
  if (id === "tutorial-term" || id === "tutorial-search") return target?.parentElement ?? null;
  if (id === "tutorial-schedules" && !target?.querySelector('[role="group"], p')) return null;
  return target;
}

export function GuideTargetOutline({ targetId }: { targetId: string }) {
  const outline = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    let target: HTMLElement | null = null;
    function update() {
      const next = guideTarget(targetId);
      if (target !== next) {
        target?.removeAttribute("data-guide-target");
        target = next;
        target?.setAttribute("data-guide-target", "");
      }
      const box = outline.current;
      if (!box) return;
      box.hidden = !target;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      Object.assign(box.style, {
        left: `${rect.left - 6}px`, top: `${rect.top - 6}px`,
        width: `${rect.width + 12}px`, height: `${rect.height + 12}px`,
        borderRadius: `${parseFloat(getComputedStyle(target).borderTopLeftRadius || "0") + 4}px`,
      });
    }
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    const resize = new ResizeObserver(update);
    resize.observe(document.body);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect(); resize.disconnect(); target?.removeAttribute("data-guide-target");
      window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update);
    };
  }, [targetId]);
  return <div ref={outline} aria-hidden className="pointer-events-none fixed z-20 border-2 border-accent" />;
}
