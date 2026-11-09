"use client";

import { useRef, type RefObject } from "react";
import { AnchoredPanel } from "@/components/ui/AnchoredPanel";
import { Button } from "@/components/ui/Button";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { AddPlanResult } from "./AddPlanResult";
import { useAddPlanToDegree } from "./useAddPlanToDegree";

export function AddToDegreePanel({ id, anchor, onClose }: { id: string; anchor: RefObject<HTMLElement | null>; onClose(): void }) {
  const { courses, termName, ready, message, add } = useAddPlanToDegree();
  const phone = usePhoneViewport();
  const footer = useRef<HTMLDivElement>(null);
  const count = `${courses.length} ${courses.length === 1 ? "course" : "courses"}`;

  return (
    <AnchoredPanel id={id} title="Add to My degree" anchor={anchor} onClose={onClose}>
      <p className="pt-2 text-8-5 leading-16 text-ink-muted">They’ll show as planned for {termName}. Changing this schedule later won’t change them.</p>
      <ul aria-label="Courses to add" className="mt-12 flex max-h-220 flex-col overflow-y-auto rounded-card border border-line">
        {courses.map((course) => (
          <li key={course.code} className="flex items-baseline gap-8 border-b border-line px-11 py-8 last:border-b-0">
            <span className="shrink-0 text-9 leading-13 font-600 text-ink">{course.code}</span>
            <span className="min-w-0 truncate text-9 leading-13 text-ink-muted">{course.title}</span>
          </li>
        ))}
      </ul>
      <div ref={footer} tabIndex={-1} className="pt-12 outline-none">
        {message ? (
          <AddPlanResult message={message} />
        ) : (
          <Button
            size={phone ? "lg" : "md"}
            fullWidth
            className="max-tablet:min-h-44"
            disabled={!ready}
            onClick={() => {
              // The button is about to be replaced, so focus stays in the panel.
              footer.current?.focus();
              void add();
            }}
          >
            Add {count}
          </Button>
        )}
      </div>
    </AnchoredPanel>
  );
}
