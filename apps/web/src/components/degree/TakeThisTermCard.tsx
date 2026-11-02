"use client";

import { Plus } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { suggestions, useCourseGaps, type DegreeHistory } from "@/lib/degree";
import { usePlanner } from "@/lib/store";
import { InsightCard } from "./InsightCard";

export function TakeThisTermCard({ history }: { history: DegreeHistory }) {
  const term = usePlanner((state) => state.term);
  const ready = usePlanner((state) => state.termStatus === "ready");
  const planned = usePlanner((state) => state.courses);
  const addCourse = usePlanner((state) => state.addCourse);
  const name = usePlanner((state) => state.terms.find((item) => item.id === state.termId)?.name ?? "this term");
  const gaps = useCourseGaps(ready && term ? term.courses : null, planned);
  const known = new Set(history.courses.map((course) => course.code));
  const offered = new Set(term?.courses.map((course) => course.code) ?? []);
  const details = gaps?.details ? new Map([...gaps.details].filter(([code]) => offered.has(code) && !known.has(code) && !planned.includes(code))) : null;
  const list = suggestions(details);

  return (
    <InsightCard title={`Take in ${name}`} badge="Your open term">
      {list.length === 0 && <p className="py-12 text-tile leading-16 text-ink-muted">{gaps?.status === "failed" ? "We couldn’t check this term’s courses right now." : gaps?.status === "waiting" ? "Looking through this term’s courses…" : "Nothing in this term closes a line you still need."}</p>}
      <ul>
        {list.map(({ code, text }) => (
          <li key={code} className="flex items-center justify-between gap-12 border-b border-line py-16">
            <div className="min-w-0">
              <p className="text-9 leading-15 font-650">{code}</p>
              <p className="pt-5 text-tile leading-14-4 text-ink-muted">{text}</p>
            </div>
            <Button variant="secondary" size="sm" icon={<Plus aria-hidden />} aria-label={`Add ${code} to plan`} className="min-h-34 text-tile" onClick={() => addCourse(code)}>Add to plan</Button>
          </li>
        ))}
      </ul>
      <p className="pt-14 text-tile leading-14-4 text-ink-muted">Free-elective-only matches are excluded.</p>
    </InsightCard>
  );
}
