"use client";

import { useRef, useState } from "react";
import { cx } from "@/components/ui/cx";
import type { DegreeSnapshot } from "@/lib/degree";
import { CreditsCard } from "./CreditsCard";
import { PaceCard } from "./PaceCard";
import { PlanningFirstCard } from "./PlanningFirstCard";
import { TakeThisTermCard } from "./TakeThisTermCard";
import { SUGGESTIONS_ON } from "./degreeFeatures";
import type { DegreeView } from "./useDegreeView";

const CARD_COUNT = SUGGESTIONS_ON ? 4 : 3;

export function InsightsSection({ view, degree }: { view: DegreeView; degree: DegreeSnapshot }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [card, setCard] = useState(0);

  function onScroll() {
    const element = scroller.current;
    if (!element) return;
    const first = element.firstElementChild?.clientWidth ?? 1;
    setCard(Math.min(CARD_COUNT - 1, Math.round(element.scrollLeft / (first + 8))));
  }

  return (
    <section aria-label="Insights" className="flex flex-col gap-14">
      <div className="flex items-center justify-between gap-12">
        <h2 className="text-14 leading-22 font-650">Insights</h2>
        <p className="text-micro leading-13 text-ink-muted tablet:text-caption">Computed on this device</p>
      </div>
      <div
        ref={scroller}
        onScroll={onScroll}
        className="-mr-(--size-phone-gutter) flex snap-x snap-mandatory gap-8 overflow-x-auto pr-(--size-phone-gutter) [scrollbar-width:none] tablet:mr-0 tablet:grid tablet:grid-cols-2 tablet:gap-16 tablet:overflow-visible tablet:pr-0 [&::-webkit-scrollbar]:hidden [&>*]:w-[calc(100%-1.25rem)] [&>*]:shrink-0 [&>*]:snap-start tablet:[&>*]:w-auto"
      >
        <CreditsCard view={view} degree={degree} />
        <PaceCard view={view} />
        <PlanningFirstCard view={view} />
        {SUGGESTIONS_ON && <TakeThisTermCard />}
      </div>
      <div aria-hidden className="flex justify-center gap-4 tablet:hidden">
        {Array.from({ length: CARD_COUNT }, (_, index) => (
          <span key={index} className={cx("h-4 rounded-pill", index === card ? "w-14 bg-accent" : "w-4 bg-line-strong")} />
        ))}
      </div>
    </section>
  );
}
