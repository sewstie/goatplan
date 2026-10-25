"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import { CaretDown, Check } from "@phosphor-icons/react/ssr";
import { cx } from "./cx";
import { floatingPosition } from "./floatingPosition";

export type ListboxOption = { value: string; label: string; description?: string };
export type ListboxVariant = "field" | "menu";

type ListboxProps = Omit<ComponentProps<"button">, "onChange" | "children" | "onClick" | "onBlur" | "onKeyDown"> & {
  label: string;
  /** Visible label shown before the value in the menu variant. Ignored for field. */
  menuLabel?: string;
  options: readonly ListboxOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: ListboxVariant;
};

const triggerBase =
  "rounded-row border border-line bg-surface px-9 text-left text-10 leading-14-5 text-ink focus-visible:border-choice-line focus-visible:shadow-field-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface-disabled disabled:text-ink-faint";

// The menu is the field look, sized to sit in the Preferences row.
const triggerClasses: Record<ListboxVariant, string> = {
  field: "flex min-h-36.5 w-full items-center justify-between gap-6 py-9",
  menu: "relative inline-flex min-h-32 min-w-146 cursor-pointer items-center gap-6 py-7",
};

export function Listbox({ label, menuLabel, options, value, onChange, variant = "field", className, ...props }: ListboxProps) {
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
    // List is at least as wide as the trigger, and wide enough for content
    popup.current.style.minWidth = `${anchor.width}px`;
    popup.current.style.width = "max-content";
    const size = popup.current.getBoundingClientRect();
    // The menu sits at the end of a row, so its list lines up with the trigger's right edge.
    const offsetX = variant === "menu" ? anchor.width - size.width : 0;
    const position = floatingPosition(anchor, size, { width: window.innerWidth, height: window.innerHeight }, { gap: 0, offsetX });
    popup.current.style.left = `${position.left}px`;
    popup.current.style.top = `${position.top}px`;
    popup.current.style.visibility = "visible";
  }, [open, variant]);

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
        className={cx(triggerBase, triggerClasses[variant], className)}
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
        {variant === "menu" && menuLabel && (
          <span className="text-ink-muted">{menuLabel}</span>
        )}
        <span className={cx("truncate", variant === "menu" && "flex-1")}>{options[selected]?.label}</span>
        <CaretDown
          aria-hidden
          className={cx("size-11 shrink-0 transition-transform motion-reduce:transition-none", open && "rotate-180")}
        />
        {/* Invisible extended hit area for 44px tap target on menu variant */}
        {variant === "menu" && (
          <span aria-hidden className="absolute inset-x-0 top-1/2 h-44 -translate-y-1/2" />
        )}
      </button>
      {open && createPortal(
        <div ref={popup} id={popupId} role="listbox" aria-label={label} className="invisible fixed z-40 max-h-[min(400px,calc(100vh-16px))] overflow-y-auto rounded-[11px] border border-listbox-line bg-surface p-5 shadow-listbox">
          {options.map((option, index) => (
            <div key={option.value} id={`${id}-option-${index}`} role="option" aria-selected={option.value === value} aria-labelledby={`${id}-name-${index}`} aria-describedby={option.description ? `${id}-description-${index}` : undefined}
              className={cx("relative flex min-h-49 cursor-pointer flex-col justify-center gap-2.5 rounded-[7px] px-9 py-9 pr-26", option.value === value ? "bg-accent-soft text-accent" : cx("text-ink", index === active && "bg-surface-selected"))}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
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
