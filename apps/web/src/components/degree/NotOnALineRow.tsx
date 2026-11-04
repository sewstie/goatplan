"use client";

import { CaretRight, Info } from "@phosphor-icons/react/ssr";
import { notOnALine, type DegreeHistory } from "@/lib/degree";
import { useDegreeUi } from "./degreeUi";
import type { DegreeView } from "./useDegreeView";

export function NotOnALineRow({ view, history }: { view: DegreeView; history: DegreeHistory }) {
  const open = useDegreeUi((state) => state.open);
  const extras = notOnALine(view.result.extra, history, view.sheet);
  return (
    <section aria-label="Not on a line" className="flex flex-col gap-10 border-t border-card-line py-14 tablet:flex-row tablet:py-8 tablet:items-center tablet:justify-between">
      <div className="flex min-w-0 flex-col gap-6 tablet:flex-row tablet:flex-wrap tablet:items-center tablet:gap-16">
        <p className="flex items-center gap-8 text-8 leading-14-4 text-ink-muted"><Info aria-hidden className="size-14 text-ink" />Not on a line</p>
        {extras.length === 0 ? (
          <p className="text-8 leading-14-4 text-ink-muted">Every course in your history counts.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {extras.map(({ code, text }) => (
              <li key={code} className="flex flex-col gap-1 tablet:flex-row tablet:items-baseline tablet:gap-10">
                <span className="text-8-5 leading-16 font-510">{code}</span>
                <span className="text-caption leading-14-4 text-ink-muted">{text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="button" onClick={() => open({ kind: "history", tab: "history" })} className="flex shrink-0 cursor-pointer items-center gap-8 self-start rounded-badge text-8 leading-14-4 font-600 text-accent hover:underline tablet:self-auto">
        Review history
        <CaretRight aria-hidden className="size-11 text-ink" />
      </button>
    </section>
  );
}
