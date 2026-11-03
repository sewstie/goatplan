import type { ReactNode } from "react";
import { DetailsPanel } from "./DetailsPanel";
import { TopBar } from "./TopBar";

type AppShellProps = {
  sidebar: ReactNode;
  header: ReactNode;
  barCenter?: ReactNode;
  barActions?: ReactNode;
  toolbar?: ReactNode;
  /** Full-width messages between the toolbar and the calendar, like "No schedule fits." */
  banner?: ReactNode;
  schedule: ReactNode;
  details?: ReactNode;
  /** The names screen readers give the two main regions. */
  scheduleLabel?: string;
  detailsLabel?: string;
  /** No details panel while the planner's term can't load (div.app-2.md). */
  hideDetailsOnTermError?: boolean;
};

export function AppShell({
  sidebar,
  header,
  barCenter,
  barActions,
  toolbar,
  banner,
  schedule,
  details,
  scheduleLabel = "Weekly schedule",
  detailsLabel = "Course details",
  hideDetailsOnTermError = false,
}: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col tablet:h-[max(100dvh,36rem)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-8 focus:left-8 focus:z-20 focus:rounded-control focus:bg-surface focus:px-11 focus:py-9 focus:text-11 focus:font-570 focus:text-accent focus:shadow-popover"
      >
        Skip to main content
      </a>
      <TopBar center={barCenter} actions={barActions} />
      {/* Phone: a single column with a 16px side gutter. Tablet and up: the sidebar plus the main region. */}
      <div className="mx-auto flex min-h-0 w-full max-w-(--size-app-max) flex-1 gap-(--size-gutter) px-(--size-phone-gutter) py-(--size-app-padding) tablet:px-20 tablet:py-20">
        <div className="contents">{sidebar}</div>
        <main
          id="main"
          tabIndex={-1}
          className="flex min-w-0 flex-1 flex-col gap-(--size-gutter) outline-none tablet:min-h-0 tablet:overflow-y-auto wide:flex-row wide:overflow-visible"
        >
          <div className="flex min-w-0 flex-col gap-(--size-gutter) tablet:min-h-full tablet:flex-1 tablet:shrink-0 wide:min-h-0 wide:shrink">
            <div className="order-2 tablet:order-none tablet:contents">{header}</div>
            <div className="order-6 tablet:order-none tablet:contents">{toolbar}</div>
            {/*
              Phone: the banner (e.g. the guide storage note) sits right under the header, above the
              schedule, instead of at the very bottom. Tablet and up keep the source order.
            */}
            <div className="order-3 tablet:order-none tablet:contents">{banner}</div>
            <section
              aria-label={scheduleLabel}
              className="relative order-4 flex flex-col overflow-hidden rounded-panel bg-surface tablet:order-none tablet:min-h-400 tablet:flex-1 wide:min-h-0"
            >
              {schedule}
            </section>
          </div>
          {/* The side details panel is hidden on a phone; the bottom sheet takes its place. */}
          {details && (
            <DetailsPanel label={detailsLabel} hideOnTermError={hideDetailsOnTermError}>
              {details}
            </DetailsPanel>
          )}
        </main>
      </div>
    </div>
  );
}
