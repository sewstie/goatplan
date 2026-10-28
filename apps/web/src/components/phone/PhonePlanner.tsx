"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import { Brand } from "@/components/shell/Brand";
import { DataUpdated } from "@/components/shell/DataUpdated";
import { PhoneCourseScreen } from "./PhoneCourseScreen";
import { PhonePreferencesScreen } from "./PhonePreferencesScreen";
import { PhoneScheduleScreen } from "./PhoneScheduleScreen";
import { PhoneSearchScreen } from "./PhoneSearchScreen";
import { PhoneTermSelect } from "./PhoneTermSelect";
import { usePhoneScreen } from "./phoneScreen";

/**
 * The planner below the tablet breakpoint: a top bar, then one screen at a time. The schedule screen
 * stays mounted while another is open, so the guide and the calendar's scroll survive a trip to
 * search or details. It comes last in the DOM, so lookups by ID find the open screen's copy first.
 */
export function PhonePlanner({ banner }: { banner: ReactNode }) {
  const screen = usePhoneScreen((state) => state.screen);
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo?.({ top: 0 });
    if (screen === "search") return;
    main.current?.querySelector<HTMLElement>("[data-phone-screen]:not([hidden]) [data-screen-heading]")?.focus({ preventScroll: true });
  }, [screen]);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-8 focus:left-8 focus:z-20 focus:rounded-control focus:bg-surface focus:px-11 focus:py-9 focus:text-11 focus:font-570 focus:text-accent focus:shadow-popover"
      >
        Skip to main content
      </a>
      <div className="flex min-h-(--size-phone-bar) items-center justify-between gap-12 border-b border-line bg-surface px-(--size-phone-gutter)">
        <Brand variant="phone" />
        <PhoneTermSelect />
      </div>
      <main ref={main} id="main" tabIndex={-1} className="flex min-w-0 flex-1 flex-col px-(--size-phone-gutter) pt-14 pb-20 outline-none">
        {screen === "search" && <div data-phone-screen><PhoneSearchScreen /></div>}
        {screen === "course" && <div data-phone-screen className="flex flex-1 flex-col"><PhoneCourseScreen /></div>}
        {screen === "preferences" && <div data-phone-screen><PhonePreferencesScreen /></div>}
        <div data-phone-screen hidden={screen !== "schedule"}>
          <PhoneScheduleScreen banner={banner} />
        </div>
        <footer className="mt-auto flex flex-col items-center pt-20 text-8 text-ink-muted">
          <DataUpdated />
          <nav aria-label="Help">
            <a href="https://courselistings.wpi.edu" target="_blank" rel="noreferrer" className="inline-flex min-h-44 items-center gap-4 rounded-badge underline hover:text-ink">
              Data source<span className="sr-only"> (opens in a new tab)</span>
              <ArrowSquareOut aria-hidden className="size-12" />
            </a>
          </nav>
        </footer>
      </main>
    </div>
  );
}
