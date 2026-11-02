"use client";

import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import { ReplayGuideButton } from "@/components/tutorial/ReplayGuideButton";
import { formatDataDate } from "@/lib/data/terms";
import { usePlanner } from "@/lib/store";

/** The strip at the bottom of every page: when the course data was updated and where it comes from. */
export function PageFooter({ termId }: { termId?: string }) {
  const terms = usePlanner((state) => state.terms);
  const storeTermId = usePlanner((state) => state.termId);
  const term = terms.find((item) => item.id === (termId ?? storeTermId));
  const updated = term ? formatDataDate(term.generatedAt) : null;

  return (
    <footer className="flex min-h-(--size-page-footer) shrink-0 flex-col items-center justify-center gap-x-13 gap-y-8 bg-canvas px-16 py-14 text-8 leading-12 text-ink-muted tablet:flex-row tablet:py-0 print:hidden">
      {updated && (
        <p>
          Course data updated <time dateTime={term!.generatedAt}>{updated}</time>
        </p>
      )}
      <nav aria-label="Help" className={stacked ? "flex flex-wrap items-center gap-x-10 gap-y-2 whitespace-nowrap" : "flex items-center gap-x-13"}>
        <a href="https://courselistings.wpi.edu" target="_blank" rel="noreferrer" className="inline-flex items-center gap-5 rounded-badge underline hover:text-ink">
          Data source<span className="sr-only"> (opens in a new tab)</span>
          <ArrowSquareOut aria-hidden className="size-12 text-ink" />
        </a>
        <ReplayGuideButton className="cursor-pointer rounded-badge whitespace-nowrap underline hover:text-ink" />
      </nav>
    </footer>
  );
}
