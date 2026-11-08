"use client";

import { useState } from "react";
import type { MapNode } from "@/lib/courseMap/courseMap";
import { foundCourse, getDegreeSource, nextTerm, parseTerm, termLong, typedCourse } from "@/lib/degree";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useDegreeUi } from "@/components/degree/degreeUi";
import { OpenInPlanner } from "@/components/degree/OpenInPlanner";
import { TermPicker } from "@/components/degree/TermPicker";
import { useCurrentTerm } from "@/components/degree/useCurrentTerm";
import { usePlanStart } from "@/components/degree/usePlanStart";
import { usePublishedTerms } from "@/components/degree/usePublishedTerms";

export function PlanCourseDialog({ node, open, close }: { node: MapNode | null; open: boolean; close(): void }) {
  const current = useCurrentTerm();
  const startYear = usePlanStart();
  const [chosen, setTerm] = useState<string | null>(null);
  const term = chosen ?? termLong(nextTerm(current));
  const published = usePublishedTerms();
  const set = useDegreeUi((state) => state.set);
  const named = parseTerm(term)!;
  const termId = `${named.year}-${named.letter}`;
  const add = () => {
    if (!node) return;
    const source = getDegreeSource();
    const added = source.addCourse({ ...(node.offering ? foundCourse(node.offering) : { ...typedCourse(node.code), title: node.title }), status: "planned", term });
    const result = added === "duplicate" ? source.editCourse(node.code, { term }) : added;
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
        <TermPicker label="Term" value={term} onChange={setTerm} startYear={startYear} current={current} />
      </div>
    </Dialog>
  );
}
