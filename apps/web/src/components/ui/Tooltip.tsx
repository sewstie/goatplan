"use client";

import {
  cloneElement,
  useEffect,
  useId,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { cx } from "./cx";

type TooltipProps = {
  content: ReactNode;
  children: ReactElement<{ "aria-describedby"?: string }>;
  placement?: "bottom" | "top";
  className?: string;
};

export function Tooltip({ content, children, placement = "bottom", className }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const describedBy = [children.props["aria-describedby"], id].filter(Boolean).join(" ");

  return (
    <span
      className="relative inline-flex"
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {cloneElement(children, { "aria-describedby": describedBy })}
      <span
        role="tooltip"
        id={id}
        hidden={!open}
        className={cx(
          "absolute left-0 z-10 w-220 rounded-card border border-line-popover bg-surface px-14 py-12 text-10 leading-15 text-ink shadow-popover before:absolute before:inset-x-0 before:h-7",
          placement === "bottom" ? "top-full mt-6 before:-top-7" : "bottom-full mb-6 before:-bottom-7",
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}
