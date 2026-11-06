"use client";

import { Button } from "@/components/ui/Button";
import { InsightCard } from "./InsightCard";
import { useDegreeUi } from "./degreeUi";

export function TakeThisTermCard() {
  const open = useDegreeUi((state) => state.open);
  return <InsightCard title="Suggest courses">
    <p className="py-12 text-tile leading-16 text-ink-muted">Pick a term and find courses that close missing lines or checks.</p>
    <Button variant="secondary" size="sm" className="self-start" onClick={() => open({ kind: "suggest" })}>Suggest courses</Button>
    <p className="pt-14 text-tile leading-14-4 text-ink-muted">Free electives are left out.</p>
  </InsightCard>;
}
