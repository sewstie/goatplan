"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export const SMALLEST_FIT = 0.7;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 1.5;

export function fitZoom(available: number, width: number) {
  return Math.min(1, Math.max(SMALLEST_FIT, Math.floor((available / width) * 100) / 100));
}

export function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));
}

export function wheelZoom(current: number, deltaY: number) {
  return clampZoom(current * Math.exp(-deltaY * 0.0025));
}

type Anchor = { x: number; y: number; left: number; from: number };

export function useMapZoom(width: number) {
  const scroller = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  const [chosen, setChosen] = useState<number | null>(null);
  const zoom = chosen ?? fit;
  const current = useRef(zoom);
  const anchor = useRef<Anchor | null>(null);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const measure = () => setFit(fitZoom(element.clientWidth, width));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [width]);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const box = element.getBoundingClientRect();
      const from = current.current;
      anchor.current = { x: (element.scrollLeft + event.clientX - box.left) / from, y: (event.clientY - box.top) / from, left: event.clientX - box.left, from };
      setChosen(wheelZoom(from, event.deltaY));
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  useLayoutEffect(() => {
    const element = scroller.current;
    current.current = zoom;
    const point = anchor.current;
    if (!element || !point) return;
    anchor.current = null;
    element.scrollLeft = point.x * zoom - point.left;
    window.scrollBy(0, point.y * (zoom - point.from));
  }, [zoom]);

  return {
    scroller,
    zoom,
    fitted: chosen === null,
    setZoom: (value: number) => setChosen(clampZoom(value)),
    reset: () => setChosen(null),
  };
}
