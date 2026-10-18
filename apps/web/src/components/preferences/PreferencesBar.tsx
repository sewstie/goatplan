"use client";

import { useCallback, useId, useRef } from "react";
import { Toggle } from "@/components/ui/Toggle";
import { usePlanner } from "@/lib/store";
import { BlockedTimeChips } from "./BlockedTimeChips";
import { BlockTimeButton } from "./BlockTimeButton";
import { SortSelect } from "./SortSelect";
import { StartTimeSelect } from "./StartTimeSelect";

/** The Preferences row: start time, blocked times, Only open sections and Sort (div.app.md, div.app-6.md). */
export function PreferencesBar() {
  const labelId = useId();
  const onlyOpen = usePlanner((state) => state.preferences.onlyOpen);
  const setPreferences = usePlanner((state) => state.setPreferences);
  const blockAddRef = useRef<HTMLSpanElement>(null);
  const focusBlockAdd = useCallback(() => blockAddRef.current?.querySelector("button")?.focus(), []);

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="flex min-h-35.5 shrink-0 flex-wrap items-center gap-7 px-2 py-1.5"
    >
      <span id={labelId} className="text-9 leading-13 font-600 text-ink-muted">
        Preferences
      </span>
      <StartTimeSelect />
      <BlockedTimeChips onAllRemoved={focusBlockAdd} />
      <span ref={blockAddRef} className="contents">
        <BlockTimeButton />
      </span>
      <Toggle
        checked={onlyOpen}
        onCheckedChange={(checked) => setPreferences({ onlyOpen: checked })}
        label="Only open sections"
        className="ml-3"
      />
      <SortSelect />
    </div>
  );
}
