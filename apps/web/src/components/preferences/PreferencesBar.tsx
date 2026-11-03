"use client";

import { useCallback, useId, useRef } from "react";
import { selectReadOnlyPlan, usePlanner } from "@/lib/store";
import { ReadOnlyPreferences } from "./ReadOnlyPreferences";
import { BlockedTimeChips } from "./BlockedTimeChips";
import { BlockedTimesMenu } from "./BlockedTimesMenu";
import { BlockTimeButton } from "./BlockTimeButton";
import { OnlyOpenPill } from "./OnlyOpenPill";
import { StartTimeSelect } from "./StartTimeSelect";

/** The row at the top of the calendar: start time, blocked times and only open sections. */
export function PreferencesBar() {
  const saved = usePlanner(selectReadOnlyPlan);
  const labelId = useId();
  const onlyOpen = usePlanner((state) => state.preferences.onlyOpen);
  const setPreferences = usePlanner((state) => state.setPreferences);
  const drawing = usePlanner((state) => state.drawing);
  const blockAddRef = useRef<HTMLSpanElement>(null);
  const focusBlockAdd = useCallback(() => blockAddRef.current?.querySelector("button")?.focus(), []);

  if (saved) return <ReadOnlyPreferences plan={saved} withSort={false} />;

  return (
    <div id="tutorial-preferences" role="group" aria-labelledby={labelId} className="flex min-h-44 flex-wrap items-center gap-x-6 gap-y-4 py-3">
      <span id={labelId} className="mr-2 text-9 leading-13 font-600 text-ink-muted">Preferences</span>
      <StartTimeSelect className="shrink-0" />
      {drawing ? <BlockedTimesMenu /> : <BlockedTimeChips onAllRemoved={focusBlockAdd} />}
      <span ref={blockAddRef} className="contents"><BlockTimeButton /></span>
      <OnlyOpenPill id="tutorial-only-open" checked={onlyOpen} onChange={(checked) => setPreferences({ onlyOpen: checked })} />
    </div>
  );
}
