import type { ReactNode } from "react";

type AppShellProps = {
  sidebar: ReactNode;
  header: ReactNode;
  toolbar?: ReactNode;
  schedule: ReactNode;
  details?: ReactNode;
};

export function AppShell({ sidebar, header, toolbar, schedule, details }: AppShellProps) {
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
          <div className="flex flex-1 flex-col gap-(--size-gutter) wide:min-h-0 wide:flex-row">
            <section
              aria-label="Weekly schedule"
              className="relative flex h-630 shrink-0 flex-col overflow-hidden rounded-panel bg-surface wide:h-auto wide:min-h-0 wide:flex-1"
            >
              {schedule}
            </section>
            {details && (
              <aside
                aria-label="Course details"
                className="flex flex-col rounded-panel bg-surface px-16 py-20 wide:w-(--size-details) wide:shrink-0 wide:overflow-y-auto"
              >
                {details}
              </aside>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
