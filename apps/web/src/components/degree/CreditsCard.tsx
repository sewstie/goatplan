"use client";

import { useState } from "react";
import { ChartBar, CheckFat, CircleDashed, Rows } from "@phosphor-icons/react/ssr";
import { hasEnoughDates, type DegreeSnapshot } from "@/lib/degree";
import { CreditsChart } from "./CreditsChart";
import { CreditsNoDates } from "./CreditsNoDates";
import { CreditsTable } from "./CreditsTable";
import { InsightCard } from "./InsightCard";
import type { DegreeView } from "./useDegreeView";

export function CreditsCard({ view, degree }: { view: DegreeView; degree: DegreeSnapshot }) {
  const [table, setTable] = useState(false);
  const { credits } = view;
  const enough = hasEnoughDates(credits);
  const undated = credits.undated;
  return (
    <InsightCard
      title="Units per term"
      action={
        <button type="button" onClick={() => setTable(!table)} className="flex cursor-pointer items-center gap-5 rounded-badge text-caption leading-14-4 font-600 text-accent hover:underline tablet:text-8">
          {table ? <ChartBar aria-hidden className="size-13 text-ink" /> : <Rows aria-hidden className="size-13 text-ink" />}
          {table ? "Show chart" : "Show as table"}
        </button>
      }
    >
      {table ? <CreditsTable credits={credits} /> : enough ? <CreditsChart credits={credits} /> : <CreditsNoDates credits={credits} />}
      {!table && (
        <>
          <div className="flex items-center justify-between pt-8 text-caption leading-14-4 text-ink-muted">
            <p className="flex items-center gap-10">
              <span className="flex items-center gap-4"><CheckFat aria-hidden className="size-11" />Done</span>
              <span className="flex items-center gap-4"><CircleDashed aria-hidden className="size-11" />Planned</span>
            </p>
            <p>WPI units</p>
          </div>
          {undated > 0 && degree.history.courses.length > 0 && (
            <p className="pt-12 text-tile leading-14-4 text-ink-muted">
              {undated} {!enough && "completed "}{undated === 1 ? "course has" : "courses have"} no term. Add terms for a clearer pace.
            </p>
          )}
        </>
      )}
    </InsightCard>
  );
}
