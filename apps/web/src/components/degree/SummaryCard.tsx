import type { ReactNode } from "react";

/** The small grey card at the top of a drawer, saying what it's about. */
export function SummaryCard({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="rounded-card border border-card-line bg-canvas px-17 py-14">
      <p className="text-8 leading-14-4 text-ink-muted">{eyebrow}</p>
      <p className="pt-5 text-10 leading-16-5 font-650">{title}</p>
      {children}
    </div>
  );
}
