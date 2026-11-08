"use client";

import { Check } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";

export type Added = { codes: string[]; text: string; undo: boolean };

export function AddedStatus({ added, onUndo }: { added: Added | null; onUndo(codes: string[]): void }) {
  return (
    <div role="status" className="min-h-24 pt-8 text-8-5 leading-16">
      {added && (
        <span className={cx("inline-flex items-center gap-8", added.undo ? "text-success-ink" : "text-ink-muted")}>
          {added.undo && <Check aria-hidden weight="bold" className="size-13 shrink-0" />}
          {added.text}
          {added.undo && <button type="button" onClick={() => onUndo(added.codes)} className="cursor-pointer font-650 text-accent underline">Undo</button>}
        </span>
      )}
    </div>
  );
}
