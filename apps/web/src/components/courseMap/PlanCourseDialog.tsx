"use client";

import { useState } from "react";
import type { MapNode } from "@/lib/courseMap/courseMap";
import { getDegreeSource, nextTerm, parseTerm, termLong } from "@/lib/degree";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useDegreeUi } from "@/components/degree/degreeUi";
import { OpenInPlanner } from "@/components/degree/OpenInPlanner";
import { TermPicker } from "@/components/degree/TermPicker";
import { useCurrentTerm } from "@/components/degree/useCurrentTerm";
import { usePlanStart } from "@/components/degree/usePlanStart";
import { usePublishedTerms } from "@/components/degree/usePublishedTerms";
import { offerHintNode } from "@/components/degree/offerHint";
import { useTermOffers } from "@/components/degree/useTermOfferings";
import { firstOffered } from "@/lib/degree/termOfferings";
import { planMapCourse } from "./planMapCourse";

export function PlanCourseDialog({ node, open, close }: { node: MapNode | null; open: boolean; close(): void }) {
  const current = useCurrentTerm();
  const startYear = usePlanStart();
  const [chosen, setTerm] = useState<string | null>(null);
  const published = usePublishedTerms();
  const offers = useTermOffers(node?.code ?? null);
  const term = chosen ?? termLong(firstOffered(nextTerm(current), offers));
  const set = useDegreeUi((state) => state.set);
  const named = parseTerm(term)!;
  const termId = `${named.year}-${named.letter}`;
  const add = () => {
    if (!node) return;
    const source = getDegreeSource();
    const result = planMapCourse(source, node, term);
    set({ toast: { message: result === "invalid" ? "This course couldn’t be planned." : result === "unsaved" ? `${node.code} planned for this visit. Browser storage is unavailable.` : `${node.code} planned for ${term}.` } });
    close();
  };
  return (
    <Dialog
      open={open}
      onClose={close}
      title={`Plan ${node?.code ?? "course"}`}
      footer={<>
        {node && published.terms.some((item) => item.id === termId) && <OpenInPlanner termId={termId} code={node.code} size="lg" />}
        <Button onClick={add}>Plan for {term}</Button>
      </>}
    >
      <div className="pt-8">
        <TermPicker label="Term" value={term} onChange={setTerm} startYear={startYear} current={current} offers={offers} hint={offerHintNode(node?.code, term, offers)} />
      </div>
    </Dialog>
  );
}
