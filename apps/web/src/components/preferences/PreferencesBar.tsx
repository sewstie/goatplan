"use client";

import { useCallback, useId, useRef } from "react";
import { Toggle } from "@/components/ui/Toggle";
import { selectSavedPlan, usePlanner } from "@/lib/store";
import { ReadOnlyPreferences } from "./ReadOnlyPreferences";
import { useHeldHeight } from "@/components/schedule/useHeldHeight";
import { BlockedTimeChips } from "./BlockedTimeChips";
import { BlockedTimesMenu } from "./BlockedTimesMenu";
import { BlockTimeButton } from "./BlockTimeButton";
import { SortSelect } from "./SortSelect";
import { StartTimeSelect } from "./StartTimeSelect";

/** The Preferences row: start time, blocked times, Only open sections and Sort (div.app.md, div.app-6.md). */
export function PreferencesBar() {
  const saved = usePlanner(selectSavedPlan);
  const labelId = useId();
  const onlyOpen = usePlanner((state) => state.preferences.onlyOpen);
  const setPreferences = usePlanner((state) => state.setPreferences);
  const drawing = usePlanner((state) => state.drawing);
  const [heldRef, heldStyle] = useHeldHeight<HTMLDivElement>(drawing);
  const blockAddRef = useRef<HTMLSpanElement>(null);
  const focusBlockAdd = useCallback(() => blockAddRef.current?.querySelector("button")?.focus(), []);

  if (saved) return <ReadOnlyPreferences plan={saved} />;

  return (
    <div
      ref={heldRef}
      style={heldStyle}
      id="tutorial-preferences"
      role="group"
      aria-labelledby={labelId}
      className="flex min-h-35.5 shrink-0 flex-wrap items-center gap-7 px-2 py-1.5"
    >
      <span id={labelId} className="text-9 leading-13 font-600 text-ink-muted">
        Preferences
      </span>
      <StartTimeSelect />
      {drawing ? <BlockedTimesMenu /> : <BlockedTimeChips onAllRemoved={focusBlockAdd} />}
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
    </div>
  );
}
