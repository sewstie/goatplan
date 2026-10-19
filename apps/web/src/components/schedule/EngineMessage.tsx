"use client";

import { ArrowClockwise, Warning } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { usePlanner } from "@/lib/store";
import { CalendarMessage } from "./CalendarMessage";

export function EngineMessage({ unsure = false }: { unsure?: boolean }) {
  const retrySolve = usePlanner((state) => state.retrySolve);
  return (
    <CalendarMessage
      role="alert"
      icon={<Warning className="text-ink" />}
      title={unsure ? "Too many combinations to check." : "Couldn’t check your schedules."}
      actions={!unsure && (
        <Button icon={<ArrowClockwise aria-hidden />} onClick={() => {
          document.getElementById("main")?.focus();
          void retrySolve();
        }}>
          Retry
        </Button>
      )}
    >
      <p>{unsure ? "Try fewer courses." : "Something went wrong. Change a preference to try again."}</p>
    </CalendarMessage>
  );
}
