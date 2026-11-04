"use client";

import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import { planningFirst } from "@/lib/degree";
import { InsightCard } from "./InsightCard";
import type { DegreeView } from "./useDegreeView";

export function PlanningFirstCard({ view }: { view: DegreeView }) {
  const items = planningFirst(view.sheet, view.result.checks);
  return (
    <InsightCard title="What needs planning first">
      <ol className="flex flex-col pl-10 tablet:pl-0">
        {items.map((item, index) => (
          <li key={item.title} className="flex gap-7 border-b border-line py-12 tablet:py-6 last:border-b-0">
            <span className="text-tile leading-14-4 text-ink-muted">{index + 1}.</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-12">
                <p className="text-tile leading-16 font-600">{item.title}</p>
                {item.aside ? (
                  <span className="shrink-0 text-caption leading-14-4 text-ink-muted">{item.aside}</span>
                ) : (
                  <button type="button" aria-label="Go to your sheet" onClick={() => document.querySelector('[aria-label="Your sheet"], [aria-label="Your requirements"]')?.scrollIntoView()} className="cursor-pointer rounded-badge text-ink">
                    <ArrowUpRight aria-hidden className="size-13" />
                  </button>
                )}
              </div>
              <p className="pt-3 text-tile leading-14-4 text-ink-muted">{item.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </InsightCard>
  );
}
