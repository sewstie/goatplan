"use client";

import type { ComponentProps } from "react";
import { FlowchartMap } from "./FlowchartMap";
import { useMapZoom } from "./useMapZoom";

type MapViewProps = Omit<ComponentProps<typeof FlowchartMap>, "zoom" | "scroller" | "setZoom" | "resetZoom">;

export function MapView(props: MapViewProps) {
  const { scroller, zoom, fitted, setZoom, reset } = useMapZoom(props.layout.width);
  return (
    <div className="relative min-w-0">
      <FlowchartMap {...props} zoom={zoom} scroller={scroller} setZoom={setZoom} resetZoom={reset} />
      <div className="flow-zoom">
        {fitted ? <><span className="flow-zoom-mouse">Ctrl + scroll to zoom</span><span className="flow-zoom-touch">Scroll to explore</span></> : <><span>{Math.round(zoom * 100)}%</span><button type="button" onClick={reset}>Fit</button></>}
      </div>
    </div>
  );
}
