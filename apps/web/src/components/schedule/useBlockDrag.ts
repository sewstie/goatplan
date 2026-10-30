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
const HOLD_MS = 400;
const HOLD_SLOP_PX = 8;

type Press = {
  pointerId: number;
  x: number;
  y: number;
  from: number;
  anchor: number;
  erase: boolean;
  touch: boolean;
  started: boolean;
  timer: ReturnType<typeof setTimeout> | null;
};

const same = (a: DragSelection | null, b: DragSelection) =>
  a !== null && a.from === b.from && a.to === b.to && a.time.start === b.time.start && a.time.end === b.time.end;

/**
 * Drawing a blocked time on the calendar. A mouse or pen drags right away; a finger presses and holds
 * first, so swipes and scrolling still work. Day columns are the elements with data-drag-day.
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
    if (current?.timer) clearTimeout(current.timer);
    if (current && surface?.hasPointerCapture(current.pointerId)) surface.releasePointerCapture(current.pointerId);
    press.current = null;
    latest.current = null;
    setSelection(null);
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (!drag || !event.isPrimary || event.button !== 0) return;
    const target = event.target as Element;
    if (!target.closest("[data-drag-day]") || target.closest("button, a")) return;
    const { index, minute } = locate(event.clientX, event.clientY);
    const day = days[index];
    if (!day) return;
    const touch = event.pointerType === "touch";
    const current: Press = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      from: index,
      anchor: minute,
      erase: blockedAt(drag.blocked, day, minute),
      touch,
      started: false,
      timer: null,
    };
    if (touch) current.timer = setTimeout(() => start(current), HOLD_MS);
    press.current = current;
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const current = press.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (!current.started) {
      const moved = Math.hypot(event.clientX - current.x, event.clientY - current.y);
      if (current.touch) {
        if (moved > HOLD_SLOP_PX) stop();
        return;
      }
      if (moved < MOVE_PX) return;
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

  // A column hands its touch capture to the surface when a long press starts; only the surface's own loss counts.
  function onLostPointerCapture(event: PointerEvent<HTMLElement>) {
    if (event.target === event.currentTarget) onPointerCancel(event);
  }

  const cancelOnEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    stop();
  });

  // Once a long press has started, the finger draws instead of scrolling the page.
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
    window.addEventListener("keydown", cancel);
    return () => window.removeEventListener("keydown", cancel);
  }, [dragging]);

  useEffect(() => () => {
    if (press.current?.timer) clearTimeout(press.current.timer);
  }, []);

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
          style: dragging ? { touchAction: "none" as const } : undefined,
        }
      : { ref: setSurface },
  };
}
