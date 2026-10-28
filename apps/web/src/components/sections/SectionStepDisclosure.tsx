import type { Ref } from "react";
import { CaretDown } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";

export function SectionStepDisclosure({ kind, open, listId, onToggle, buttonRef, busy = false }: {
  kind: string;
  open: boolean;
  listId: string;
  onToggle: () => void;
  buttonRef: Ref<HTMLButtonElement>;
  busy?: boolean;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-expanded={open}
      aria-controls={listId}
      aria-disabled={busy}
      onClick={() => { if (!busy) onToggle(); }}
      className="mt-7.5 flex w-full cursor-pointer items-center justify-between rounded-badge px-3 py-2 text-9 leading-13-5 text-ink-muted hover:text-ink"
    >
      {open ? `Hide other ${kind} choices` : `View other ${kind} choices`}
      <CaretDown aria-hidden className={cx("size-11 text-ink transition-transform motion-reduce:transition-none", open && "rotate-180")} />
    </button>
  );
}
