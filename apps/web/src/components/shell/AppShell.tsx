import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";
import { DetailsPanel } from "./DetailsPanel";

type AppShellProps = {
  sidebar: ReactNode;
  header: ReactNode;
  toolbar?: ReactNode;
  /** Full-width messages between the toolbar and the calendar, like "No schedule fits." */
  banner?: ReactNode;
  schedule: ReactNode;
  details?: ReactNode;
  /** The names screen readers give the two main regions. */
  scheduleLabel?: string;
  detailsLabel?: string;
  /**
   * Below the wide breakpoint the main region is 630px tall, which suits the calendar. "content" lets
   * it grow with longer content instead, like the registration sheet.
   */
  scheduleFit?: "fixed" | "content";
  /** No details panel while the planner's term can't load (div.app-2.md). */
  hideDetailsOnTermError?: boolean;
};

export function AppShell({
  sidebar,
  header,
  toolbar,
  banner,
  schedule,
  details,
  scheduleLabel = "Weekly schedule",
  detailsLabel = "Course details",
  scheduleFit = "fixed",
  hideDetailsOnTermError = false,
}: AppShellProps) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-8 focus:left-8 focus:z-20 focus:rounded-control focus:bg-surface focus:px-11 focus:py-9 focus:text-11 focus:font-570 focus:text-accent focus:shadow-popover"
      >
        Skip to main content
      </a>
      <div className="flex min-h-dvh gap-(--size-gutter) p-(--size-app-padding) wide:h-[max(100dvh,720px)]">
        {sidebar}
        <main
          id="main"
          tabIndex={-1}
          className="flex min-w-0 flex-1 flex-col gap-(--size-gutter) outline-none"
        >
          {header}
          {toolbar}
          {banner}
          <div className="flex flex-1 flex-col gap-(--size-gutter) wide:min-h-0 wide:flex-row">
            <section
              aria-label={scheduleLabel}
              className={cx(
                "relative flex shrink-0 flex-col overflow-hidden rounded-panel bg-surface wide:h-auto wide:min-h-0 wide:flex-1",
                scheduleFit === "fixed" ? "h-630" : "min-h-630",
              )}
            >
              {schedule}
            </section>
            {details && (
              <DetailsPanel label={detailsLabel} hideOnTermError={hideDetailsOnTermError}>
                {details}
              </DetailsPanel>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
