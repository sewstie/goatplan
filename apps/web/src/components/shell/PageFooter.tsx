"use client";

import type { ReactNode } from "react";
import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import { FeedbackLink } from "@/components/shell/FeedbackLink";
import { ReplayGuideButton } from "@/components/tutorial/ReplayGuideButton";
import { formatDataDate } from "@/lib/data/terms";
import { usePlanner } from "@/lib/store";

/** The strip at the bottom of a phone page: when the course data was updated, where it comes from, the guide and feedback. */
export function PageFooter({ termId, generatedAt, feedbackTopic = "Planner feedback", extra }: { termId?: string; generatedAt?: string; feedbackTopic?: string; extra?: ReactNode }) {
  const terms = usePlanner((state) => state.terms);
  const storeTermId = usePlanner((state) => state.termId);
  const term = terms.find((item) => item.id === (termId ?? storeTermId));
  const dataDate = generatedAt ?? term?.generatedAt;
  const updated = dataDate ? formatDataDate(dataDate) : null;

  return (
    <footer className="flex min-h-(--size-page-footer) shrink-0 flex-col items-center justify-center gap-x-13 gap-y-8 bg-canvas px-16 py-14 text-8 leading-12 text-ink-muted tablet:flex-row tablet:py-0 print:hidden">
      {extra}
      {updated && (
        <p>
          Course data updated <time dateTime={dataDate}>{updated}</time>
        </p>
      )}
      <nav aria-label="Help" className="flex items-center gap-x-13">
        <a href="https://courselistings.wpi.edu" target="_blank" rel="noreferrer" className="inline-flex items-center gap-5 rounded-badge underline hover:text-ink">
          Data source<span className="sr-only"> (opens in a new tab)</span>
          <ArrowSquareOut aria-hidden className="size-12 text-ink" />
        </a>
        <ReplayGuideButton className="cursor-pointer rounded-badge whitespace-nowrap underline hover:text-ink" />
        <FeedbackLink topic={feedbackTopic} className="rounded-badge whitespace-nowrap underline hover:text-ink">Send feedback</FeedbackLink>
      </nav>
    </footer>
  );
}
