"use client";

import {
  cloneElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx";
import { floatingPosition } from "./floatingPosition";

type TriggerProps = {
  "aria-describedby"?: string;
  onPointerEnter?: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave?: (event: PointerEvent<HTMLElement>) => void;
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
};

type TooltipProps = {
  content: ReactNode;
  children: ReactElement<TriggerProps>;
  placement?: "bottom" | "top";
  /**
   * Renders into document.body with position: fixed, so a container that clips its content (like the
   * calendar card) can't cut it off. It goes to the other side near the screen's edge, closes on scroll
   * and resize, and is only in the page while shown.
   */
  portal?: boolean;
  /** With portal: where it starts from the trigger's left edge, and how far from the trigger it sits. */
  offsetX?: number;
  gap?: number;
  /** Off when the trigger's own label already says everything, so screen readers don't hear it twice. */
  describes?: boolean;
  className?: string;
};

const surface =
  "w-220 rounded-card border border-line-popover bg-surface px-14 py-12 text-10 leading-15 text-ink shadow-popover";

export function Tooltip({
  content,
  children,
  placement = "bottom",
  portal = false,
  offsetX,
  gap,
  describes = true,
  className,
}: TooltipProps) {
  const id = useId();
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  const open = trigger !== null;
  const floatingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setTrigger(null);
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKeyDown);
    if (portal) {
      window.addEventListener("scroll", close, true);
      window.addEventListener("resize", close);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open, portal]);

  // Placed after it renders, when its real size is known; it stays invisible until then.
  useLayoutEffect(() => {
    const box = floatingRef.current;
    if (!portal || !trigger || !box) return;
    const { left, top } = floatingPosition(
      trigger.getBoundingClientRect(),
      box.getBoundingClientRect(),
      { width: window.innerWidth, height: window.innerHeight },
      { placement, offsetX, gap },
    );
    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
    box.style.visibility = "visible";
  }, [portal, trigger, placement, offsetX, gap]);

  const own = children.props["aria-describedby"];
  const describedBy = describes && (open || !portal) ? [own, id].filter(Boolean).join(" ") : own;

  if (portal) {
    const props = children.props;
    return (
      <>
        {cloneElement(children, {
          "aria-describedby": describedBy,
          onPointerEnter: (event) => {
            props.onPointerEnter?.(event);
            setTrigger(event.currentTarget);
          },
          onPointerLeave: (event) => {
            props.onPointerLeave?.(event);
            setTrigger(null);
          },
          onFocus: (event) => {
            props.onFocus?.(event);
            setTrigger(event.currentTarget);
          },
          onBlur: (event) => {
            props.onBlur?.(event);
            setTrigger(null);
          },
        })}
        {open &&
          createPortal(
            <div
              ref={floatingRef}
              role="tooltip"
              id={id}
              aria-hidden={describes ? undefined : true}
              className={cx("pointer-events-none invisible fixed z-30", surface, className)}
            >
              {content}
            </div>,
            document.body,
          )}
      </>
    );
  }

  return (
    <span
      className="relative inline-flex"
      onPointerEnter={(event) => setTrigger(event.currentTarget)}
      onPointerLeave={() => setTrigger(null)}
      onFocus={(event) => setTrigger(event.currentTarget)}
      onBlur={() => setTrigger(null)}
    >
      {cloneElement(children, { "aria-describedby": describedBy })}
      <span
        role="tooltip"
        id={id}
        hidden={!open}
        aria-hidden={describes ? undefined : true}
        className={cx(
          "absolute left-0 z-10 before:absolute before:inset-x-0 before:h-7",
          surface,
          placement === "bottom" ? "top-full mt-6 before:-top-7" : "bottom-full mb-6 before:-bottom-7",
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}
