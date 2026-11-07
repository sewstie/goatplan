"use client";

import { useState } from "react";
import type { MapNode } from "@/lib/courseMap/courseMap";
import { foundCourse, getDegreeSource, parseTerm, typedCourse } from "@/lib/degree";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { useDegreeUi } from "@/components/degree/degreeUi";
import { OpenInPlanner } from "@/components/degree/OpenInPlanner";
import { termChoices } from "@/components/degree/termChoices";
import { usePublishedTerms } from "@/components/degree/usePublishedTerms";

export function PlanCourseDialog({ node, open, close }: { node: MapNode | null; open: boolean; close(): void }) {
  const [term, setTerm] = useState("C Term 2027");
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
    <Dialog open={open} onClose={close} title={`Plan ${node?.code ?? "course"}`}>
      <div className="flex flex-col gap-14">
        <Select label="Term" hideLabel={false} options={termChoices().filter((option) => option.value)} value={term} onChange={(event) => setTerm(event.target.value)} />
        <div className="flex flex-wrap gap-8">
          <Button onClick={add}>Plan for {term}</Button>
          {node && published.terms.some((item) => item.id === termId) && <OpenInPlanner termId={termId} code={node.code} />}
        </div>
      </div>
    </Dialog>
  );
}
