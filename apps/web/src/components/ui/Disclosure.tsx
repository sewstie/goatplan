import type { ReactNode } from "react";
import { CaretDown } from "@phosphor-icons/react/ssr";
import { cx } from "./cx";

/** A closed "Details ⌄" line that opens to show the rest. */
export function Disclosure({ summary, children, className }: { summary: string; children: ReactNode; className?: string }) {
  return (
    <details className={cx("group border-t border-line", className)}>
      <summary className="flex min-h-36 cursor-pointer list-none items-center justify-between gap-8 rounded-row text-9 leading-13 font-600 text-ink-soft hover:text-ink max-tablet:min-h-44 [&::-webkit-details-marker]:hidden">
        {summary}
        <CaretDown aria-hidden className="size-11 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  );
}
