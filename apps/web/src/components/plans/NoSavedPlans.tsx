import type { Ref } from "react";
import { BookmarkSimple } from "@phosphor-icons/react/ssr";
import { ButtonLink } from "@/components/ui/ButtonLink";

/** The empty list, in the style of the calendar's message card (div.app.md). */
export function NoSavedPlans({ headingRef }: { headingRef?: Ref<HTMLHeadingElement> }) {
  return (
    <div className="flex flex-1 items-center justify-center p-20">
      <div className="flex w-full max-w-(--size-message) flex-col items-center gap-6 rounded-message border border-line bg-surface-overlay px-20 py-28 text-center">
        <span className="flex size-42 items-center justify-center rounded-tile bg-accent-soft text-accent">
          <BookmarkSimple aria-hidden className="size-23" />
        </span>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="pt-7 text-17 leading-23-8 font-700 tracking-message text-ink outline-none"
        >
          No saved plans yet
        </h2>
        <p className="text-11 leading-19-8 text-ink-muted">
          Build a schedule in the planner, then press Save schedule.
        </p>
        <ButtonLink href="/" className="mt-8">
          Go to the planner
        </ButtonLink>
      </div>
    </div>
  );
}
