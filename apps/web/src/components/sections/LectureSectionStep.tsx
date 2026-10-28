import { useId, useRef, type ReactNode, type RefCallback } from "react";
import { CaretDown } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import type { Section } from "@/lib/data/types";
import type { LectureChoices } from "./sectionSteps";
import { LectureChoiceList } from "./LectureChoiceList";

export function LectureSectionStep({ choices, children, open, busy, onOpenChange, onChoose, buttonRef }: {
  choices: LectureChoices;
  children: ReactNode;
  open: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onChoose: (section: Section) => void;
  buttonRef: RefCallback<HTMLButtonElement>;
}) {
  const listId = useId();
  const disclosure = useRef<HTMLButtonElement>(null);
  return (
    <div onKeyDown={(event) => {
      if (event.key !== "Escape" || !open) return;
      event.stopPropagation();
      onOpenChange(false);
      disclosure.current?.focus();
    }}>
      {children}
      {choices.label !== "Only lecture" && <>
        <button ref={(button) => { disclosure.current = button; buttonRef(button); }} type="button"
          aria-expanded={open} aria-controls={listId} aria-disabled={busy}
          onClick={() => { if (!busy) onOpenChange(!open); }}
          className="mt-7.5 flex w-full cursor-pointer items-center justify-between gap-4 rounded-badge px-3 py-2 text-9 leading-13-5 text-ink-muted hover:text-ink">
          {choices.label}<CaretDown aria-hidden className={cx("size-11 shrink-0 text-ink transition-transform motion-reduce:transition-none", open && "rotate-180")} />
        </button>
        {open && !busy && <LectureChoiceList id={listId} choices={choices.choices} onChoose={onChoose} />}
      </>}
    </div>
  );
}
