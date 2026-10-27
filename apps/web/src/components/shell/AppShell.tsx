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
  /**
   * The phone-only "Your courses" disclosure, shown between the header and the toolbar below the
   * tablet breakpoint. It stands in for the sidebar, which is hidden on a phone.
   */
  phoneDisclosure?: ReactNode;
  /** The phone-only bottom sheet for course details, hidden on tablet and wider screens. */
  phoneSheet?: ReactNode;
  /** Phone-only content placed at the very bottom of the page (after the schedule area). */
  phoneFooter?: ReactNode;
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
  phoneDisclosure,
  phoneSheet,
  phoneFooter,
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
      {/* Phone: a single column with a 16px side gutter. Tablet and up: the sidebar plus the main region. */}
      <div className="flex min-h-dvh gap-(--size-gutter) px-(--size-phone-gutter) py-(--size-app-padding) tablet:p-(--size-app-padding) wide:h-[max(100dvh,720px)]">
        {/* The sidebar is hidden on a phone; its term picker and courses move into the disclosure. */}
        <div className="contents">{sidebar}</div>
        <main
          id="main"
          tabIndex={-1}
          className="flex min-w-0 flex-1 flex-col gap-(--size-gutter) outline-none"
        >
          {header}
          {phoneDisclosure}
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
            {/* The side details panel is hidden on a phone; the bottom sheet takes its place. */}
            {details && (
              <DetailsPanel label={detailsLabel} hideOnTermError={hideDetailsOnTermError}>
                {details}
              </DetailsPanel>
            )}
          </div>
          {phoneFooter}
        </main>
      </div>
      {phoneSheet}
    </>
  );
}
