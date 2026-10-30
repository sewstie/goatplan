import type { CSSProperties } from "react";
import { cx } from "@/components/ui/cx";

/** The rectangle drawn while dragging out a blocked time, or one that is being removed. */
export function DragSelectionBox({ text, erase, style }: { text?: string; erase: boolean; style: CSSProperties }) {
  return (
    <div
      aria-hidden
      data-drag-selection={erase ? "erase" : "add"}
      className={cx(
        "pointer-events-none absolute inset-x-2 z-3 overflow-hidden rounded-block border-2 border-dashed px-5 pt-2",
        erase ? "border-warning bg-warning-soft text-warning-ink" : "border-accent bg-accent-soft text-accent",
      )}
      style={style}
    >
      {text && <p className="line-clamp-2 text-9 leading-13 font-650">{text}</p>}
    </div>
  );
}
