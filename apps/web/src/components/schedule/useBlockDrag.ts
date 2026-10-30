"use client";

import { useEffect, useEffectEvent, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import type { Day } from "@/lib/data/types";
import type { PlanBlockedTime } from "@/lib/store";
import { blockedAt, changeText, dayIndexAt, dayRanges, minuteAt, snapRange, type DayRange } from "./dragBlock";
import type { TimeRange } from "./timeRange";

export type DragSelection = { from: number; to: number; time: TimeRange; erase: boolean };

export type BlockDrag = {
  blocked: readonly PlanBlockedTime[];
  /** Returns the days that really changed, for the announcement. */
  onDrop(ranges: DayRange[], erase: boolean): Day[];
};

const MOVE_PX = 4;

type Press = {
  pointerId: number;
  x: number;
  y: number;
  from: number;
  anchor: number;
  erase: boolean;
  touch: boolean;
  started: boolean;
};

const same = (a: DragSelection | null, b: DragSelection) =>
  a !== null && a.from === b.from && a.to === b.to && a.time.start === b.time.start && a.time.end === b.time.end;

/**
 * Drawing a blocked time on the calendar, in drawing mode only (drag is undefined otherwise). A drag
 * starts once the pointer moves 4 px, anywhere in a day column. A finger can still swipe sideways to
 * other days; up and down it draws. Day columns are the elements with data-drag-day.
 */
export function useBlockDrag(days: readonly Day[], range: TimeRange, drag: BlockDrag | undefined) {
  const [surface, setSurface] = useState<HTMLElement | null>(null);
  const press = useRef<Press | null>(null);
  const [selection, setSelection] = useState<DragSelection | null>(null);
  const latest = useRef<DragSelection | null>(null);
  const [announcement, setAnnouncement] = useState("");

  function locate(x: number, y: number) {
    const columns = [...(surface?.querySelectorAll<HTMLElement>("[data-drag-day]") ?? [])].map((column) =>
      column.getBoundingClientRect(),
    );
    const index = dayIndexAt(x, columns);
    const column = columns[index];
    return { index, minute: column ? minuteAt(y, column.top, column.height, range) : range.start };
  }

  function follow(current: Press, x: number, y: number) {
    const { index, minute } = locate(x, y);
    const next = { from: current.from, to: index, time: snapRange(current.anchor, minute, range), erase: current.erase };
    if (same(latest.current, next)) return;
    latest.current = next;
    setSelection(next);
  }

  function start(current: Press) {
    current.started = true;
    if (surface?.isConnected) surface.setPointerCapture(current.pointerId);
    follow(current, current.x, current.y);
  }

  function stop() {
    const current = press.current;
    if (current && surface?.hasPointerCapture(current.pointerId)) surface.releasePointerCapture(current.pointerId);
    press.current = null;
    latest.current = null;
    setSelection(null);
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    // ⌘-click and Ctrl-click pick blocked times instead of drawing.
    if (!drag || !event.isPrimary || event.button !== 0 || event.metaKey || event.ctrlKey) return;
    if (!(event.target as Element).closest("[data-drag-day]")) return;
    const { index, minute } = locate(event.clientX, event.clientY);
    const day = days[index];
    if (!day) return;
    press.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      from: index,
      anchor: minute,
      erase: blockedAt(drag.blocked, day, minute),
      touch: event.pointerType === "touch",
      started: false,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const current = press.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (!current.started) {
      if (Math.hypot(event.clientX - current.x, event.clientY - current.y) < MOVE_PX) return;
      start(current);
    }
    follow(current, event.clientX, event.clientY);
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    const current = press.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const chosen = latest.current;
    if (current.started && chosen && drag) {
      const changed = drag.onDrop(dayRanges(days, chosen.from, chosen.to, chosen.time), chosen.erase);
      if (changed.length > 0) setAnnouncement(changeText(changed, chosen.time, chosen.erase));
    }
    stop();
  }

  function onPointerCancel(event: PointerEvent<HTMLElement>) {
    if (press.current?.pointerId === event.pointerId) stop();
  }

  // A column hands its touch capture to the surface when a drag starts; only the surface's own loss counts.
  function onLostPointerCapture(event: PointerEvent<HTMLElement>) {
    if (event.target === event.currentTarget) onPointerCancel(event);
  }

  const cancelOnEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    stop();
  });

  // Once a drag has started, the finger draws instead of swiping to other days.
  useEffect(() => {
    if (!surface) return;
    const hold = (event: TouchEvent) => {
      if (press.current?.started) event.preventDefault();
    };
    surface.addEventListener("touchmove", hold, { passive: false });
    return () => surface.removeEventListener("touchmove", hold);
  }, [surface]);

  const dragging = selection !== null;
  useEffect(() => {
    if (!dragging) return;
    const cancel = (event: KeyboardEvent) => cancelOnEscape(event);
    // Capture, so a cancelled drag's Escape doesn't also leave drawing mode.
    window.addEventListener("keydown", cancel, true);
    return () => window.removeEventListener("keydown", cancel, true);
  }, [dragging]);

  return {
    selection,
    announcement,
    surfaceProps: drag
      ? {
          ref: setSurface,
          onPointerDown,
          onPointerMove,
          onPointerUp,
          onPointerCancel,
          onLostPointerCapture,
          onContextMenu: (event: MouseEvent<HTMLElement>) => {
            if (press.current?.touch) event.preventDefault();
          },
          style: { touchAction: dragging ? ("none" as const) : ("pan-x" as const) },
        }
      : { ref: setSurface },
  };
}
