"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import { CaretDown, Check } from "@phosphor-icons/react/ssr";
import { cx } from "./cx";
import { floatingPosition } from "./floatingPosition";

export type ListboxOption = { value: string; label: string; description?: string };

type ListboxProps = Omit<ComponentProps<"button">, "onChange" | "children" | "onClick" | "onBlur" | "onKeyDown"> & {
  label: string;
  options: readonly ListboxOption[];
  value: string;
  onChange: (value: string) => void;
};

export function Listbox({ label, options, value, onChange, className, ...props }: ListboxProps) {
  const id = useId();
  const popupId = `${id}-listbox`;
  const button = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const search = useRef({ text: "", time: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selected = Math.max(0, options.findIndex((option) => option.value === value));

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !button.current?.contains(event.target) && !popup.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !button.current || !popup.current) return;
    const anchor = button.current.getBoundingClientRect();
    popup.current.style.width = `${anchor.width}px`;
    const position = floatingPosition(anchor, popup.current.getBoundingClientRect(), { width: window.innerWidth, height: window.innerHeight }, { gap: 0 });
    popup.current.style.left = `${position.left}px`;
    popup.current.style.top = `${position.top}px`;
    popup.current.style.visibility = "visible";
  }, [open]);

  useLayoutEffect(() => {
    if (open) popup.current?.children.item(active)?.scrollIntoView?.({ block: "nearest" });
  }, [active, open]);

  return (
    <>
      <button
        {...props}
        ref={button}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={popupId}
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        className={cx("flex min-h-36.5 w-full items-center justify-between gap-6 rounded-row border border-line bg-surface px-9 py-9 text-left text-10 leading-14-5 text-ink focus-visible:border-choice-line focus-visible:shadow-field-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface-disabled disabled:text-ink-faint", className)}
        onClick={() => { setActive(selected); setOpen(!open); }}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (!open || event.key.length !== 1) search.current.text = "";
          if (event.key === "Escape" && open) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
            button.current?.focus();
          } else if (event.key === "Tab") {
            setOpen(false);
          } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (open) { onChange(options[active].value); setOpen(false); }
            else { setActive(selected); setOpen(true); }
          } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) { setActive(selected); setOpen(true); }
            else setActive(Math.max(0, Math.min(options.length - 1, active + (event.key === "ArrowDown" ? 1 : -1))));
          } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            setActive(event.key === "Home" ? 0 : options.length - 1);
            setOpen(true);
          } else if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            const key = event.key.toLowerCase();
            const previous = Date.now() - search.current.time < 700 ? search.current.text : "";
            const text = previous === key ? key : previous + key;
            search.current = { text, time: Date.now() };
            const start = open ? active : selected;
            if (!open) setActive(selected);
            for (let offset = text.length === 1 ? 1 : 0; offset <= options.length; offset++) {
              const index = (start + offset) % options.length;
              if (options[index].label.toLowerCase().startsWith(text)) { setActive(index); break; }
            }
            setOpen(true);
          }
        }}
      >
        <span className="truncate">{options[selected]?.label}</span>
        <CaretDown aria-hidden className="size-11 shrink-0" />
      </button>
      {open && createPortal(
        <div ref={popup} id={popupId} role="listbox" aria-label={label} className="invisible fixed z-40 max-h-[min(400px,calc(100vh-16px))] overflow-y-auto rounded-[11px] border border-listbox-line bg-surface p-5 shadow-listbox">
          {options.map((option, index) => (
            <div key={option.value} id={`${id}-option-${index}`} role="option" aria-selected={option.value === value} aria-labelledby={`${id}-name-${index}`} aria-describedby={option.description ? `${id}-description-${index}` : undefined}
              className={cx("relative flex min-h-49 cursor-pointer flex-col justify-center gap-2.5 rounded-[7px] px-9 py-9 pr-26", option.value === value ? "bg-accent-soft text-accent" : "text-ink", index === active && index !== selected && "bg-surface-selected")}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => { onChange(option.value); setOpen(false); button.current?.focus(); }}
            >
              <span id={`${id}-name-${index}`} className="text-10 leading-14-5 font-700">{option.label}</span>
              {option.description && <span id={`${id}-description-${index}`} className="text-8 leading-12-8 text-ink-muted">{option.description}</span>}
              {option.value === value && <Check aria-hidden className="absolute top-1/2 right-9 size-13 -translate-y-1/2 text-ink" />}
            </div>
          ))}
        </div>, document.body,
      )}
    </>
  );
}
