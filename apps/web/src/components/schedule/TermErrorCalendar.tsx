"use client";

import { ArrowClockwise, Warning } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { WEEK } from "@/lib/data/days";
import { usePlanner } from "@/lib/store";
import { CalendarMessage } from "./CalendarMessage";
import { DEFAULT_RANGE } from "./timeRange";
import { WeekCalendar } from "./WeekCalendar";

/** The term file didn't load (div.app-2.md). */
export function TermErrorCalendar() {
  const termId = usePlanner((state) => state.termId);
  const termName = usePlanner((state) => state.terms.find((term) => term.id === state.termId)?.name ?? null);
  const setTerm = usePlanner((state) => state.setTerm);
  const init = usePlanner((state) => state.init);

  return (
    <WeekCalendar
      days={WEEK.slice(0, 5)}
      range={DEFAULT_RANGE}
      caption="No timed courses yet"
      note="Auto-fit to your schedule"
      overlay={
        <CalendarMessage
          role="alert"
          icon={<Warning className="text-ink" />}
          title={termName ? `Couldn’t load ${termName} sections.` : "Couldn’t load course sections."}
          actions={
            <Button
              icon={<ArrowClockwise aria-hidden />}
              onClick={() => {
                // The button goes away while the term reloads, so focus moves to the main content.
                document.getElementById("main")?.focus();
                void (termId ? setTerm(termId) : init());
              }}
            >
              Retry
            </Button>
          }
        >
          <p>Check your connection and try again.</p>
        </CalendarMessage>
      }
    />
  );
}
