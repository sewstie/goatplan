import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

const toneClasses = {
  accent: "border-accent-line bg-surface text-accent",
  alert: "border-alert-line bg-alert-soft text-alert",
};

/** "Schedule 3 of 24", or the warning "0 schedules fit" (div.app-3.md, div.app-7.md). */
export function CountPill({ tone = "accent", compact = false, wide = false, children }: { tone?: keyof typeof toneClasses; compact?: boolean; wide?: boolean; children: ReactNode }) {
  return (
    <p
      aria-live="polite"
      aria-atomic
      className={cx(
        "rounded-row border font-650 whitespace-nowrap",
        compact ? "px-8 py-4 text-9" : "px-10 py-5.5 text-12 leading-17-4",
        wide && "flex min-h-44 flex-1 items-center justify-center",
        toneClasses[tone],
      )}
    >
      {children}
    </p>
  );
}
