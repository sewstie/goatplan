"use client";

import { useCallback, useId, useRef } from "react";
import { Toggle } from "@/components/ui/Toggle";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { selectSavedPlan, usePlanner } from "@/lib/store";
import { ReadOnlyPreferences } from "./ReadOnlyPreferences";
import { BlockedTimeChips } from "./BlockedTimeChips";
import { BlockTimeButton } from "./BlockTimeButton";
import { SortSelect } from "./SortSelect";
import { StartTimeSelect } from "./StartTimeSelect";

/** The Preferences row: start time, blocked times, Only open sections and Sort (div.app.md, div.app-6.md). */
export function PreferencesBar() {
  const saved = usePlanner(selectSavedPlan);
  const labelId = useId();
  const onlyOpen = usePlanner((state) => state.preferences.onlyOpen);
  const setPreferences = usePlanner((state) => state.setPreferences);
  const blockAddRef = useRef<HTMLSpanElement>(null);
  const focusBlockAdd = useCallback(() => blockAddRef.current?.querySelector("button")?.focus(), []);
  const phone = usePhoneViewport();

  if (saved) return <ReadOnlyPreferences plan={saved} />;

  // On a phone: stack as a column. Sort and Starts-after each get a full row; toggles share one.
  // On tablet+: single wrapping flex row as before.
  return (
    <div
      id="tutorial-preferences"
      role="group"
      aria-labelledby={labelId}
      className={
        phone
          ? "flex min-h-35.5 shrink-0 flex-col flex-wrap items-start gap-7 px-2 py-1.5"
          : "flex min-h-35.5 shrink-0 flex-wrap items-center gap-7 px-2 py-1.5"
      }
    >
      <span id={labelId} className="text-9 leading-13 font-600 text-ink-muted">
        Preferences
      </span>
      {phone ? (
        <>
          {/* Phone: Starts-after gets its own full-width row */}
          <div className="flex w-full items-center gap-7">
            <StartTimeSelect />
            <BlockedTimeChips onAllRemoved={focusBlockAdd} />
            <span ref={blockAddRef} className="contents">
              <BlockTimeButton />
            </span>
          </div>
          {/* Phone: Toggles share a row */}
          <div className="flex w-full items-center gap-7">
            <Toggle
              id="tutorial-only-open"
              checked={onlyOpen}
              onCheckedChange={(checked) => setPreferences({ onlyOpen: checked })}
              label="Only open sections"
            />
          </div>
          {/* Phone: Sort gets its own full-width row */}
          <div className="flex w-full items-center gap-7">
            <SortSelect />
          </div>
        </>
      ) : (
        <>
          <StartTimeSelect />
          <BlockedTimeChips onAllRemoved={focusBlockAdd} />
          <span ref={blockAddRef} className="contents">
            <BlockTimeButton />
          </span>
          <Toggle
            id="tutorial-only-open"
            checked={onlyOpen}
            onCheckedChange={(checked) => setPreferences({ onlyOpen: checked })}
            label="Only open sections"
            className="ml-3"
          />
          <SortSelect />
        </>
      )}
    </div>
  );
}
