"use client";

import { useEffect, useRef, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import type { Chain, Flowchart } from "@/lib/courseMap/flowchart";
import type { FlowLayout } from "@/lib/courseMap/routing";
import { cx } from "@/components/ui/cx";
import { FlowCard, type CourseState } from "./FlowCard";
import { FlowLines } from "./FlowLines";

type FlowchartMapProps = {
  flow: Flowchart;
  layout: FlowLayout;
  zoom: number;
  scroller: RefObject<HTMLDivElement | null>;
  setZoom(value: number): void;
  resetZoom(): void;
  stateOf(code: string): CourseState;
  selected: string | null;
  chain: Chain | null;
  select(code: string): void;
  preview(code: string | null): void;
  clear(): void;
};

export function FlowchartMap({ flow, layout, zoom, scroller, setZoom, resetZoom, stateOf, selected, chain, select, preview, clear }: FlowchartMapProps) {
  const canvas = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && selected) clear();
    else if (event.key === "+" || event.key === "=") setZoom(zoom * 1.15);
    else if (event.key === "-") setZoom(zoom / 1.15);
    else if (event.key === "0") resetZoom();
  };
  const grab = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.pointerType !== "mouse" || (event.target as Element).closest("button")) return;
    drag.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    event.currentTarget.scrollLeft -= event.clientX - drag.current.x;
    window.scrollBy(0, drag.current.y - event.clientY);
    drag.current = { x: event.clientX, y: event.clientY };
  };
  const drop = () => { drag.current = null; };
  useEffect(() => {
    if (!selected) return;
    canvas.current?.querySelector(`[data-code="${selected}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [selected]);

  return (
    <div ref={scroller} role="region" aria-label="Course map diagram" tabIndex={0} className="flow-scroller" onKeyDown={keys} onPointerDown={grab} onPointerMove={move} onPointerUp={drop} onPointerCancel={drop}>
      <div style={{ width: layout.width * zoom, height: layout.height * zoom }}>
        <div ref={canvas} className="flow-canvas" style={{ width: layout.width, height: layout.height, transform: `scale(${zoom})` }} onMouseLeave={() => preview(null)}>
          {layout.bands.map((band) => (
            <div key={band.band}>
              {band.line !== null && <div className="flow-band-line" style={{ top: band.line }} />}
              <p className="flow-band-label" style={{ top: band.top }}>{band.band} level</p>
            </div>
          ))}
          {flow.pairs.map((pair) => {
            const box = layout.pairs[pair.id];
            const badge = layout.badges[pair.id];
            const dimmed = chain !== null && !chain.nodes.has(pair.id);
            return (
              <div key={pair.id}>
                <div className={cx("flow-pair", dimmed && "flow-dimmed")} style={{ left: box.x, top: box.y, width: box.w, height: box.h }} />
                <span className={cx("flow-or", dimmed && "flow-dimmed")} style={{ left: badge.x, top: badge.y, width: badge.w, height: badge.h }} aria-hidden>or</span>
              </div>
            );
          })}
          <FlowLines edges={layout.edges} width={layout.width} height={layout.height} chain={chain} />
          {flow.courses.map((course) => (
            <FlowCard
              key={course.code}
              course={course}
              box={layout.boxes[course.code]}
              state={stateOf(course.code)}
              selected={selected === course.code}
              dimmed={chain !== null && !chain.nodes.has(course.code)}
              select={select}
              preview={preview}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
