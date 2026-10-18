import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

const toneClasses = {
  accent: "border-accent-line bg-surface text-accent",
  alert: "border-alert-line bg-alert-soft text-alert",
};

/** "Schedule 3 of 24", or the warning "0 schedules fit" (div.app-3.md, div.app-7.md). */
export function CountPill({ tone = "accent", children }: { tone?: keyof typeof toneClasses; children: ReactNode }) {
  return (
    <p
      aria-live="polite"
      aria-atomic
      className={cx(
        "rounded-row border px-10 py-5.5 text-12 leading-17-4 font-650 whitespace-nowrap",
        toneClasses[tone],
      )}
    >
      {children}
    </p>
  );
}
