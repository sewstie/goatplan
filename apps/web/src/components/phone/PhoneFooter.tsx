import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import { DataUpdated } from "@/components/shell/DataUpdated";
import { ReplayGuideButton } from "@/components/tutorial/ReplayGuideButton";

/** The bottom of a phone page: when the course data was updated, where it comes from, and the guide again. */
export function PhoneFooter({ termId }: { termId?: string }) {
  return (
    <footer className="mt-auto flex flex-col items-center pt-20 text-8 text-ink-muted">
      <DataUpdated termId={termId} />
      <nav aria-label="Help" className="flex flex-wrap items-center justify-center gap-x-16">
        <a href="https://courselistings.wpi.edu" target="_blank" rel="noreferrer" className="inline-flex min-h-44 items-center gap-4 rounded-badge underline hover:text-ink">
          Data source<span className="sr-only"> (opens in a new tab)</span>
          <ArrowSquareOut aria-hidden className="size-12" />
        </a>
        <ReplayGuideButton className="min-h-44 cursor-pointer rounded-badge underline hover:text-ink" />
      </nav>
    </footer>
  );
}
