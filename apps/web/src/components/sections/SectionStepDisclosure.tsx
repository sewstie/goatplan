import type { Ref } from "react";
import { CaretDown } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";

export function SectionStepDisclosure({ kind, open, listId, onToggle, buttonRef }: {
  kind: string;
  open: boolean;
  listId: string;
  onToggle: () => void;
  buttonRef: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-expanded={open}
      aria-controls={listId}
      onClick={onToggle}
      className={cx("flex w-full cursor-pointer items-center justify-between rounded-badge py-2", open ? "mt-7 mb-5 text-10 leading-14-5 font-650 text-ink" : "mt-7.5 px-3 text-9 leading-13-5 text-ink-muted hover:text-ink")}
    >
      {open ? `Other ${kind} choices` : `View other ${kind} choices`}
      {!open && <CaretDown aria-hidden className="size-11 text-ink" />}
    </button>
  );
}
