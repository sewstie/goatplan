import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

/** A fact on a phone section card, with its icon: time, room or seats. */
export function PhoneFact({ icon, tone = "ink", children }: { icon: ReactNode; tone?: "ink" | "success" | "warning"; children: ReactNode }) {
  return (
    <li className={cx("flex items-start gap-10 text-10", tone === "ink" ? "text-ink" : cx("font-510", tone === "success" ? "text-success" : "text-warning"))}>
      <span aria-hidden className="flex h-19 shrink-0 items-center text-ink-soft [&_svg]:size-16">
        {icon}
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}
