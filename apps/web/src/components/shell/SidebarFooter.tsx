"use client";

import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import { ReplayGuideButton } from "@/components/tutorial/ReplayGuideButton";
import { usePlanner } from "@/lib/store";

const dataTime = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function SidebarFooter({ termId }: { termId?: string }) {
  const generatedAt = usePlanner((state) => state.terms.find((term) => term.id === (termId ?? state.termId))?.generatedAt);
  const date = generatedAt ? new Date(generatedAt) : null;
  const dated = date && !Number.isNaN(date.getTime());

  return (
    <footer className="flex shrink-0 flex-col border-t border-line pt-8 text-8 leading-12 text-ink-muted print:hidden">
      {dated && (
        <p className="flex min-h-20 items-center whitespace-nowrap">
          Data <time dateTime={generatedAt} className="ml-4">{dataTime.format(date)}</time>
        </p>
      )}
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
