"use client";

import { CalendarX } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import type { MissingItem } from "@/lib/share/buildSharedPlan";
import { SharedPageCard } from "./SharedPageCard";

type SharedPlanFreshProps = {
  missing: readonly MissingItem[];
  termName: string;
  onClose(): void;
  onReview(): void;
};

const describe = ({ course, section, sectionType }: MissingItem) => (section ? `${course} ${sectionType} ${section}` : course);

/** Some of a shared plan isn't in today's data. Nothing gets swapped in without the viewer seeing it. */
export function SharedPlanFresh({ missing, termName, onClose, onReview }: SharedPlanFreshProps) {
  const intro = missing.length === 1
    ? `The shared plan includes ${describe(missing[0])}, which is missing from the latest ${termName} data.`
    : `The shared plan includes ${missing.length} choices that are missing from the latest ${termName} data.`;
  return (
    <SharedPageCard icon={<CalendarX />} title="This plan needs a fresh look" onClose={onClose}>
      <p className="max-w-480 pt-14 text-10 leading-20 text-ink-muted">{intro}</p>
      <Notice tone="warning" title="The original choices are preserved" className="mt-16 w-full text-left">
        We haven’t substituted another lab or changed your draft.
      </Notice>
      <ul className="mt-14 flex w-full flex-col gap-6">
        {missing.map((item) => (
          <li key={`${item.course}-${item.section}`} className="flex items-center justify-between gap-12 rounded-card border border-dashed border-tile-empty-line px-14 py-14 text-left">
            <span className="text-8-5 leading-16 font-600">{item.section ? `${item.course} · ${item.section}` : item.course}</span>
            <span className="text-8-5 leading-16 text-ink-muted">Unavailable in current data</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap justify-center gap-8 pt-24">
        <Button variant="secondary" size="md" onClick={onClose}>Close preview</Button>
        <Button size="md" onClick={onReview}>Review a copy</Button>
      </div>
    </SharedPageCard>
  );
}
