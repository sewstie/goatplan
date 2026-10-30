"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addBlocked } from "@/components/preferences/blockedTimes";
import { BlockTimeDialog } from "@/components/preferences/BlockTimeDialog";
import { BLOCK_FROM, BLOCK_TO } from "@/components/preferences/timeOptions";
import { changeText, mergeBlocked } from "@/components/schedule/dragBlock";
import { count } from "@/components/schedule/scheduleCopy";
import { Toast } from "@/components/ui/Toast";
import type { Day } from "@/lib/data/types";
import { usePlanner, type BlockedChange } from "@/lib/store";

/**
 * The one toast: "Removed MA 1024 · Undo", "Blocked Mon–Wed 12–1 PM · Name it · Undo" after a drag, or
 * "Removed 3 blocked times · Undo" after deleting selected ones.
 */
export function PlannerToast() {
  const removedCourse = usePlanner((state) => state.removedCourse);
  const undoRemoveCourse = usePlanner((state) => state.undoRemoveCourse);
  const dismissRemovedCourse = usePlanner((state) => state.dismissRemovedCourse);
  const blockedChange = usePlanner((state) => state.blockedChange);
  const undoBlockedChange = usePlanner((state) => state.undoBlockedChange);
  const dismissBlockedChange = usePlanner((state) => state.dismissBlockedChange);
  const setPreferences = usePlanner((state) => state.setPreferences);
  const [naming, setNaming] = useState<BlockedChange | null>(null);

  // The code of the course a student just chose to undo. Set in the click handler and read by the
  // effect below once React has re-rendered with the course back in the list, so focus can land on
  // the restored row. A dismiss (timeout) never sets this, so the two paths stay distinct.
  const undoneCodeRef = useRef<string | null>(null);

  const handleUndo = useCallback(() => {
    if (!removedCourse) return;
    undoneCodeRef.current = removedCourse.code;
    undoRemoveCourse();
  }, [removedCourse, undoRemoveCourse]);

  useEffect(() => {
    const code = undoneCodeRef.current;
    if (removedCourse !== null || !code) return;
    undoneCodeRef.current = null;
    document.querySelector<HTMLElement>(`[data-course-row="${CSS.escape(code)}"]`)?.focus();
  }, [removedCourse]);

  // Undo and Name it remove the button that had focus, so focus moves to "Block a time" once React is done.
  const [refocus, setRefocus] = useState(0);
  useEffect(() => {
    if (refocus > 0) document.getElementById("tutorial-block-time")?.focus();
  }, [refocus]);

  function closeNaming() {
    setNaming(null);
    setRefocus((count) => count + 1);
  }

  // The name goes on the drawn time, on top of the blocked times from before the drag.
  function saveName(days: Day[], start: number, end: number, label: string) {
    if (naming) setPreferences({ blocked: mergeBlocked(addBlocked(naming.previous, days, start, end, label)) });
    closeNaming();
  }

  const nameable = blockedChange && !blockedChange.erased && blockedChange.start >= BLOCK_FROM && blockedChange.end <= BLOCK_TO;
  const toast = blockedChange
    ? {
        message: (blockedChange.count ?? 1) > 1
          ? `Removed ${count("blocked time", blockedChange.count ?? 0)}`
          : changeText(blockedChange.days, blockedChange, blockedChange.erased),
        actions: [
          ...(nameable
            ? [{ label: "Name it", onAction: () => {
                setNaming(blockedChange);
                dismissBlockedChange();
              } }]
            : []),
          { label: "Undo", onAction: () => {
            undoBlockedChange();
            setRefocus((count) => count + 1);
          } },
        ],
        onDismiss: dismissBlockedChange,
      }
    : {
        message: removedCourse ? `Removed ${removedCourse.code}` : null,
        actions: [{ label: "Undo", onAction: handleUndo }],
        onDismiss: dismissRemovedCourse,
      };

  return (
    <>
      <Toast {...toast} />
      <BlockTimeDialog
        open={naming !== null}
        onClose={closeNaming}
        onSubmit={saveName}
        initial={naming ?? undefined}
      />
    </>
  );
}
