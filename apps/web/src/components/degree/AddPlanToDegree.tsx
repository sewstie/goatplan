"use client";

import { useId, useRef } from "react";
import { GraduationCap } from "@phosphor-icons/react/ssr";
import { AddPlanResult } from "./AddPlanResult";
import { useAddPlanToDegree } from "./useAddPlanToDegree";

/** The phone's ⋯ menu row. */
export function AddPlanToDegree() {
  const { courses, termName, ready, reason, message, add } = useAddPlanToDegree();
  const box = useRef<HTMLDivElement>(null);
  const id = useId();
  const detail = reason || `${courses.length} ${courses.length === 1 ? "course" : "courses"} · planned for ${termName}`;

  return (
    <div ref={box} tabIndex={-1} className="w-full outline-none">
      {message ? (
        <AddPlanResult message={message} className="px-8 py-8" />
      ) : (
        <button
          type="button"
          disabled={!ready}
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-detail`}
          onClick={() => {
            // The button is about to be replaced, so focus stays in the menu instead of falling to the page.
            box.current?.focus();
            void add();
          }}
          className="group flex min-h-44 w-full cursor-pointer items-center gap-10 rounded-row px-8 py-8 text-left enabled:hover:bg-surface-selected disabled:cursor-not-allowed"
        >
          <span aria-hidden className="flex size-32 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent group-disabled:bg-surface-disabled group-disabled:text-ink-faint [&_svg]:size-16">
            <GraduationCap weight="bold" />
          </span>
          <span className="flex min-w-0 flex-col gap-2">
            <span id={`${id}-title`} className="text-10 leading-14-5 font-570 text-ink group-disabled:text-ink-muted">Add to My degree</span>
            <span id={`${id}-detail`} className="text-9 leading-13 text-ink-muted">{detail}</span>
          </span>
        </button>
      )}
    </div>
  );
}
