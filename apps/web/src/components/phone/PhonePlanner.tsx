"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { cx } from "@/components/ui/cx";
import { PhoneCourseScreen } from "./PhoneCourseScreen";
import { PhoneFooter } from "./PhoneFooter";
import { PhonePreferencesScreen } from "./PhonePreferencesScreen";
import { PhoneScheduleScreen } from "./PhoneScheduleScreen";
import { PhoneSearchScreen } from "./PhoneSearchScreen";
import { PhoneTermSelect } from "./PhoneTermSelect";
import { PhoneTopBar } from "./PhoneTopBar";
import { usePhoneScreen } from "./phoneScreen";

/**
 * The planner below the tablet breakpoint: a top bar, then one screen at a time. The schedule screen
 * stays mounted while another is open, so the guide and the calendar's scroll survive a trip to
 * search or details, and the page returns to where the schedule was left. It comes last in the DOM,
 * so lookups by ID find the open screen's copy first.
 */
export function PhonePlanner({ banner }: { banner: ReactNode }) {
  const screen = usePhoneScreen((state) => state.screen);
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);
  const scheduleScroll = useRef(0);
  const course = screen === "course";

  useEffect(() => {
    const remember = () => {
      if (usePhoneScreen.getState().screen === "schedule") scheduleScroll.current = window.scrollY;
    };
    window.addEventListener("scroll", remember, { passive: true });
    return () => window.removeEventListener("scroll", remember);
  }, []);

  // The course screen scrolls inside main and the page itself can't bounce, so the browser bars stay put
  // and the bottom button doesn't jump.
  useEffect(() => {
    if (!course) return;
    const root = document.documentElement;
    root.style.overscrollBehavior = "none";
    return () => {
      root.style.overscrollBehavior = "";
    };
  }, [course]);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo?.({ top: screen === "schedule" ? scheduleScroll.current : 0 });
    if (screen === "search") return;
    main.current?.querySelector<HTMLElement>("[data-phone-screen]:not([hidden]) [data-screen-heading]")?.focus({ preventScroll: true });
  }, [screen]);

  return (
    <div className={cx("flex flex-col bg-canvas", course ? "h-dvh overflow-hidden" : "min-h-dvh")}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-8 focus:left-8 focus:z-20 focus:rounded-control focus:bg-surface focus:px-11 focus:py-9 focus:text-11 focus:font-570 focus:text-accent focus:shadow-popover"
      >
        Skip to main content
      </a>
      <PhoneTopBar>
        <PhoneTermSelect />
      </PhoneTopBar>
      <main
        ref={main}
        id="main"
        tabIndex={-1}
        className={cx(
          "flex min-w-0 flex-1 flex-col px-(--size-phone-gutter) pt-14 pb-20 outline-none",
          course && "relative min-h-0 overflow-y-auto overscroll-contain",
        )}
      >
        {screen === "search" && <div data-phone-screen><PhoneSearchScreen /></div>}
        {course && <div data-phone-screen className="flex flex-1 flex-col"><PhoneCourseScreen /></div>}
        {screen === "preferences" && <div data-phone-screen><PhonePreferencesScreen /></div>}
        <div data-phone-screen hidden={screen !== "schedule"}>
          <PhoneScheduleScreen banner={banner} />
        </div>
        <PhoneFooter />
      </main>
    </div>
  );
}
