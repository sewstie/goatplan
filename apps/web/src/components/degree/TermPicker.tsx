"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CalendarBlank, CaretDown } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import { floatingPosition } from "@/components/ui/floatingPosition";
import { parseTerm, sameTerm, termLong, type TermName } from "@/lib/degree";
import { planYears } from "@/lib/degree/planGrid";
import { termTag } from "./termTag";

type TermPickerProps = {
  label: string;
  value: string;
  onChange(value: string): void;
  startYear: number;
  current: TermName;
  allowNone?: boolean;
  hint?: ReactNode;
  className?: string;
};

type Spot = { row: number; column: number } | "none";

const HEADINGS = ["A", "B", "C", "D", "E"];

function grid(startYear: number): (TermName | null)[][] {
  return planYears(startYear).map(({ terms }, index) => terms.map((term) => (index === 3 && term.letter === "E" ? null : term)));
}

function spotOf(cells: (TermName | null)[][], term: TermName | null): Spot | null {
  if (!term) return null;
  for (const [row, terms] of cells.entries()) {
    const column = terms.findIndex((cell) => sameTerm(cell, term));
    if (column !== -1) return { row, column };
  }
  return null;
}

function step(cells: (TermName | null)[][], from: { row: number; column: number }, rows: number, columns: number): { row: number; column: number } {
  let { row, column } = from;
  for (;;) {
    row += rows;
    column += columns;
    if (row < 0 || row >= cells.length || column < 0 || column > 4) return from;
    if (cells[row][column]) return { row, column };
    if (rows !== 0 && columns === 0 && cells[row].some(Boolean)) {
      const nearest = [...cells[row].keys()].filter((index) => cells[row][index]).sort((a, b) => Math.abs(a - column) - Math.abs(b - column))[0];
      return { row, column: nearest };
    }
  }
}

export function TermPicker({ label, value, onChange, startYear, current, allowNone = false, hint, className }: TermPickerProps) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Spot>("none");
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  const cells = grid(startYear);
  const chosen = parseTerm(value);
  const tag = termTag(chosen, current);

  function show() {
    setPortal(trigger.current?.closest("dialog") ?? null);
    setActive(spotOf(cells, chosen) ?? spotOf(cells, current) ?? { row: 0, column: 0 });
    setOpen(true);
  }

  function hide(focusTrigger = true) {
    setOpen(false);
    if (focusTrigger) trigger.current?.focus();
  }

  function choose(next: string) {
    onChange(next);
    hide();
  }

  useLayoutEffect(() => {
    if (!open || !trigger.current || !popup.current) return;
    const anchor = trigger.current.getBoundingClientRect();
    popup.current.style.width = `${Math.max(anchor.width, 304)}px`;
    const size = popup.current.getBoundingClientRect();
    const position = floatingPosition(anchor, size, { width: window.innerWidth, height: window.innerHeight }, { gap: 4 });
    popup.current.style.left = `${position.left}px`;
    popup.current.style.top = `${position.top}px`;
    popup.current.style.visibility = "visible";
  }, [open]);

  useEffect(() => {
    if (!open) return;
    popup.current?.querySelector<HTMLElement>("[data-active]")?.focus();
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !trigger.current?.contains(event.target) && !popup.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      hide();
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      hide();
      return;
    }
    const moves: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    if (active === "none") {
      if (event.key === "ArrowUp") setActive(spotOf(cells, cells.flat().filter(Boolean).at(-1) ?? null) ?? "none");
      return;
    }
    if (event.key === "ArrowDown" && active.row === cells.length - 1 && allowNone) {
      setActive("none");
      return;
    }
    setActive(step(cells, active, move[0], move[1]));
  }

  return (
    <div className={cx("flex flex-col", className)}>
      <span id={`${id}-label`} className="pb-5 text-10 leading-14-5 font-650 text-ink">{label}</span>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onClick={() => (open ? hide() : show())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            show();
          }
        }}
        className="flex min-h-38 w-full cursor-pointer items-center gap-8 rounded-control border border-line bg-surface px-10 text-left text-10 leading-14-5 text-ink hover:border-line-strong"
      >
        <CalendarBlank aria-hidden className="size-14 shrink-0 text-ink-muted" />
        <span id={`${id}-value`} className="flex-1 truncate">{chosen ? termLong(chosen) : "No term"}</span>
        {tag && <span className={cx("rounded-badge px-6 py-2 text-8 leading-11-2 font-570", tag === "Now" ? "bg-accent-soft text-accent" : "bg-neutral-soft text-neutral-ink")}>{tag}</span>}
        <CaretDown aria-hidden className={cx("size-11 shrink-0 text-ink-muted transition-transform motion-reduce:transition-none", open && "rotate-180")} />
      </button>
      {hint && <span id={`${id}-hint`} className="pt-5 text-8 leading-12 text-ink-muted">{hint}</span>}
      {open && createPortal(
        <div
          ref={popup}
          role="dialog"
          aria-label={label}
          onKeyDown={onKeyDown}
          onBlur={(event) => {
            const next = event.relatedTarget;
            if (next instanceof Node && (popup.current?.contains(next) || trigger.current?.contains(next))) return;
            if (next) setOpen(false);
          }}
          className="term-picker invisible fixed z-40 rounded-listbox border border-listbox-line bg-surface p-10 text-ink shadow-listbox"
        >
          <div role="grid" aria-label="Terms by school year" className="grid grid-cols-[3.6rem_repeat(5,minmax(0,1fr))] gap-x-4 gap-y-5">
            <div role="row" className="contents">
              <span role="columnheader"><span className="sr-only">School year</span></span>
              {HEADINGS.map((letter) => <span key={letter} role="columnheader" className="pb-2 text-center text-8 leading-12 font-570 text-ink-muted">{letter === "E" ? "E · Summer" : letter}</span>)}
            </div>
            {cells.map((terms, row) => {
              const year = startYear + row;
              return (
                <div key={year} role="row" className="contents">
                  <span role="rowheader" className="flex flex-col justify-center text-8 leading-11-2 text-ink-muted"><span className="font-650 text-ink">Year {row + 1}</span>{year}–{String(year + 1).slice(-2)}</span>
                  {terms.map((term, column) => {
                    if (!term) return <span key={column} role="gridcell" aria-label="After this plan" className="rounded-row border border-dashed border-line" />;
                    const name = termLong(term);
                    const isActive = active !== "none" && active.row === row && active.column === column;
                    const selected = sameTerm(term, chosen);
                    const now = sameTerm(term, current);
                    const tagText = termTag(term, current);
                    return (
                      <span key={name} role="gridcell">
                        <button
                          type="button"
                          tabIndex={isActive ? 0 : -1}
                          data-active={isActive || undefined}
                          aria-label={tagText ? `${name}, ${tagText === "Now" ? "current term" : tagText.toLowerCase()}` : name}
                          aria-pressed={selected}
                          onClick={() => choose(name)}
                          onMouseEnter={() => setActive({ row, column })}
                          className={cx(
                            "relative flex h-34 w-full cursor-pointer flex-col items-center justify-center rounded-row text-9 leading-12 font-570 transition-colors motion-reduce:transition-none",
                            selected ? "bg-accent text-on-accent" : now ? "bg-accent-soft text-accent ring-1 ring-accent ring-inset" : term.letter === "E" ? "bg-canvas text-ink-soft hover:bg-surface-selected" : "bg-surface-subtle text-ink hover:bg-surface-selected",
                          )}
                        >
                          {term.letter} {String(term.year).slice(-2)}
                          {now && <span aria-hidden className={cx("text-micro font-650", selected ? "text-on-accent" : "text-accent")}>Now</span>}
                        </button>
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {allowNone && (
            <button
              type="button"
              tabIndex={active === "none" ? 0 : -1}
              data-active={active === "none" || undefined}
              aria-pressed={value === ""}
              onClick={() => choose("")}
              className={cx("mt-8 flex w-full cursor-pointer items-center justify-between gap-8 rounded-row border px-10 py-8 text-left", value === "" ? "border-accent bg-accent-soft text-accent" : "border-line hover:bg-surface-selected")}
            >
              <span className="text-9 leading-13 font-570">No term</span>
              <span className="text-8 leading-12 text-ink-muted">AP and IB credit</span>
            </button>
          )}
        </div>,
        portal ?? document.body,
      )}
    </div>
  );
}
