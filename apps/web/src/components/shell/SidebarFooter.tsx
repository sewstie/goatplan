"use client";

import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import { ReplayGuideButton } from "@/components/tutorial/ReplayGuideButton";
import { usePlanner } from "@/lib/store";
import { seatDate } from "./seatAge";
import { SeatFreshness } from "./SeatFreshness";

/** The last two of the sidebar's three footer lines: how fresh the data is, then the source and the guide. */
export function SidebarFooter() {
  const generatedAt = usePlanner((state) => state.terms.find((term) => term.id === state.termId)?.generatedAt);
  const dated = generatedAt && Number.isFinite(Date.parse(generatedAt));

  return (
    <footer className="flex shrink-0 flex-col text-8 leading-12 text-ink-muted print:hidden">
      <div className="flex min-h-24 items-center gap-x-4 whitespace-nowrap">
        {dated && <p>Data <time dateTime={generatedAt}>{seatDate(generatedAt)}</time></p>}
        <SeatFreshness />
      </div>
      <nav aria-label="Help" className="flex min-h-20 items-center gap-x-4 whitespace-nowrap">
        <a href="https://courselistings.wpi.edu" target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 rounded-badge underline hover:text-ink">
          Source<span className="sr-only"> (opens in a new tab)</span>
          <ArrowSquareOut aria-hidden className="size-12 text-ink" />
        </a>
        <span aria-hidden>·</span>
        <ReplayGuideButton label="Guide" className="cursor-pointer rounded-badge whitespace-nowrap underline hover:text-ink" />
      </nav>
    </footer>
  );
}
