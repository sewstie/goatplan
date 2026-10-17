"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shows a clock drawn on every animation frame, and the longest gap between frames
 * while `active` (plus the two frames after, which draw the result).
 */
export function FrameMeter({ active }: { active: boolean }) {
  const [longest, setLongest] = useState<number | null>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const measuring = useRef(false);
  const longestGap = useRef(0);

  useEffect(() => {
    const started = performance.now();
    let last = started;
    let frame = requestAnimationFrame(function tick(now) {
      if (measuring.current) longestGap.current = Math.max(longestGap.current, now - last);
      last = now;
      if (clock.current) clock.current.textContent = `${((now - started) / 1000).toFixed(2)} s`;
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!active) return;
    longestGap.current = 0;
    measuring.current = true;
    return () => {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          measuring.current = false;
          setLongest(longestGap.current);
        }),
      );
    };
  }, [active]);

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-16 gap-y-6 text-10 leading-14-5">
      <dt className="text-ink-muted">Page clock (drawn every frame)</dt>
      <dd>
        <span ref={clock} className="tabular-nums">
          0.00 s
        </span>
      </dd>
      <dt className="text-ink-muted">Longest frame during the last run</dt>
      <dd>
        <output aria-label="Longest frame" className="tabular-nums">
          {longest === null ? "—" : `${Math.round(longest)} ms`}
        </output>
      </dd>
    </dl>
  );
}
