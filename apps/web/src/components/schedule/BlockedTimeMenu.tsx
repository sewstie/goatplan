"use client";

import { useCallback, useEffect, useState } from "react";
import { BlockTimeDialog } from "@/components/preferences/BlockTimeDialog";
import { BLOCK_FROM, BLOCK_TO } from "@/components/preferences/timeOptions";
import type { Day } from "@/lib/data/types";
import { usePlanner, type PlanBlockedTime } from "@/lib/store";
import { BlockedTimePopover } from "./BlockedTimePopover";
import { BLOCKED_TIME_POPOVER_ID, useBlockedTimeMenu } from "./useBlockedTimeMenu";
import { removeBlocked, replaceBlocked } from "./dragBlock";

const focusToggle = () => document.getElementById("tutorial-block-time")?.focus();

/**
 * The popover of the blocked time the student clicked, and the form its Rename opens. It sits next to
 * the calendar rather than in it, because the calendar reloads after every change.
 */
export function BlockedTimeMenu() {
  const open = useBlockedTimeMenu((state) => state.open);
  const close = useBlockedTimeMenu((state) => state.close);
  const blocked = usePlanner((state) => state.preferences.blocked);
  const setPreferences = usePlanner((state) => state.setPreferences);
  const changeBlocked = usePlanner((state) => state.changeBlocked);
  const unavailable = usePlanner((state) => state.drawing || state.savedPlanId !== null);
  const [renaming, setRenaming] = useState<PlanBlockedTime | null>(null);
  const [refocus, setRefocus] = useState<{ to: string | null } | null>(null);

  useEffect(() => {
    if (unavailable) close();
  }, [unavailable, close]);

  useEffect(() => close, [close]);

  // After a change the calendar reloads and the block may be gone, so focus goes to "Block a time", as
  // after Undo. A cancelled Rename changed nothing, so focus goes back to the block.
  useEffect(() => {
    if (!refocus) return;
    const block = refocus.to && document.querySelector<HTMLElement>(`[data-blocked-time="${refocus.to}"]`);
    if (block) block.focus();
    else focusToggle();
  }, [refocus]);

  const handleClose = useCallback(
    (focusAnchor: boolean) => {
      if (focusAnchor) open?.anchor.focus();
      close();
    },
    [open, close],
  );

  function remove(block: PlanBlockedTime) {
    close();
    changeBlocked(removeBlocked(blocked, block), { days: [block.day], start: block.start, end: block.end, erased: true });
    setRefocus({ to: null });
  }

  function rename(days: Day[], start: number, end: number, label: string) {
    if (renaming) setPreferences({ blocked: replaceBlocked(blocked, renaming, days, start, end, label) });
    setRenaming(null);
    setRefocus({ to: null });
  }

  function cancelRename() {
    setRenaming(null);
    setRefocus({ to: renaming && `${renaming.day}-${renaming.start}-${renaming.end}` });
  }

  return (
    <>
      {open && (
        <BlockedTimePopover
          id={BLOCKED_TIME_POPOVER_ID}
          block={open.block}
          anchor={open.anchor}
          canRename={open.block.start >= BLOCK_FROM && open.block.end <= BLOCK_TO}
          onRename={() => {
            setRenaming(open.block);
            close();
          }}
          onRemove={() => remove(open.block)}
          onClose={handleClose}
        />
      )}
      <BlockTimeDialog
        open={renaming !== null}
        onClose={cancelRename}
        onSubmit={rename}
        initial={renaming ? { days: [renaming.day], start: renaming.start, end: renaming.end, label: renaming.label } : undefined}
      />
    </>
  );
}
