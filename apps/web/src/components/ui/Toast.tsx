"use client";

import { Fragment, useEffect, useEffectEvent, useRef, useState } from "react";
import { CheckCircle } from "@phosphor-icons/react/ssr";

/** How long a message stays, in milliseconds, not counting time with the pointer or focus on it. */
const DURATION = 6000;

type ToastAction = { label: string; onAction: () => void };

type ToastProps = {
  /** The text before the actions, e.g. "Removed MA 1024". `null` shows nothing. */
  message: string | null;
  /** The buttons after the message, e.g. Undo. */
  actions: readonly ToastAction[];
  /** Called when the message has been up for 6 seconds. */
  onDismiss: () => void;
  /** The dark bar My degree uses for a change with Undo. */
  dark?: boolean;
};

/**
 * One message with one action, at the bottom of the screen. The polite status region stays on the
 * page while there's nothing to show, so screen readers announce a message as soon as it appears.
 * Focus never moves here on its own; render it last so it's the last Tab stop.
 */
export function Toast({ message, actions, onDismiss, dark = false }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-16 bottom-[calc(1rem+var(--phone-tabs-space,0px))] z-10 flex justify-center"
    >
      {/* A new message is a new box, so its timer starts over. */}
      {message !== null && <ToastMessage key={message} message={message} actions={actions} onDismiss={onDismiss} dark={dark} />}
    </div>
  );
}

function ToastMessage({ message, actions, onDismiss, dark }: { message: string; actions: readonly ToastAction[]; onDismiss: () => void; dark: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const timeLeft = useRef(DURATION);
  const timeUp = useEffectEvent(onDismiss);
  const paused = hovered || focused;

  // Runs while nothing is on the toast; a pause keeps the time that's left for later.
  useEffect(() => {
    if (paused) return;
    const started = Date.now();
    const timer = setTimeout(() => timeUp(), timeLeft.current);
    return () => {
      clearTimeout(timer);
      timeLeft.current = Math.max(0, timeLeft.current - (Date.now() - started));
    };
  }, [paused]);

  if (dark) {
    return (
      <div
        className="pointer-events-auto flex w-full items-center gap-10 rounded-card bg-toast-dark px-16 py-11 text-9 leading-14-5 text-on-dark shadow-guide tablet:w-510"
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
        }}
      >
        <CheckCircle aria-hidden className="size-16 shrink-0" />
        <span className="min-w-0 flex-1">{message}</span>
        {actions.map((action) => (
          <button key={action.label} type="button" onClick={action.onAction} className="relative shrink-0 cursor-pointer rounded-badge font-650 underline after:absolute after:top-1/2 after:left-1/2 after:h-44 after:w-[max(100%,44px)] after:-translate-x-1/2 after:-translate-y-1/2">
            {action.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className="pointer-events-auto flex w-full items-center gap-12 rounded-card border border-line-popover bg-surface px-14 py-10 text-11 leading-15-95 font-570 text-ink shadow-popover transition-[opacity,translate] duration-150 ease-out starting:translate-y-8 starting:opacity-0 motion-reduce:transition-none tablet:w-auto"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <span className="min-w-0">{message}</span>
      {actions.map((action) => (
        <Fragment key={action.label}>
          {" "}<span>·</span>{" "}
          <button
            type="button"
            className="relative shrink-0 cursor-pointer rounded-badge font-650 text-accent after:absolute after:top-1/2 after:left-1/2 after:h-44 after:w-[max(100%,44px)] after:-translate-x-1/2 after:-translate-y-1/2 hover:underline"
            onClick={action.onAction}
          >
            {action.label}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
