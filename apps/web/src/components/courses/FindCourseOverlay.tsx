"use client";

import { useEffect, useRef } from "react";
import { PageFooter } from "@/components/shell/PageFooter";
import { FindCourseScreen } from "./FindCourseScreen";

/** "Find a course" over the planner, under the top bar. Its own page in looks, without leaving the plan behind. */
export function FindCourseOverlay({ query, onClose }: { query: string; onClose(): void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-label="Find a course"
      onClose={onClose}
      className="fixed inset-x-0 top-(--size-topbar) bottom-0 m-0 h-auto max-h-none w-full max-w-none overflow-y-auto bg-canvas p-0 text-ink backdrop:bg-transparent"
    >
      <div className="flex min-h-full flex-col">
        <div className="flex-1 px-16 pt-30 pb-16">
          <FindCourseScreen initialQuery={query} onBack={() => dialog.current?.close()} />
        </div>
        <PageFooter />
      </div>
    </dialog>
  );
}
