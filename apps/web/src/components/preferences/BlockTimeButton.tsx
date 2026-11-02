"use client";

import { PencilSimple, Plus } from "@phosphor-icons/react/ssr";
import { Chip } from "@/components/ui/Chip";
import { usePlanner } from "@/lib/store";

/**
 * The dashed "Block a time" pill: it turns drawing mode on and off. The drawing bar above the
 * calendar has the form for typing a time instead.
 */
export function BlockTimeButton({ label = "Block a time", className, short = false }: { label?: string; className?: string; short?: boolean } = {}) {
  const drawing = usePlanner((state) => state.drawing);
  const setDrawing = usePlanner((state) => state.setDrawing);
  return (
    <Chip
      id="tutorial-block-time"
      variant="dashed"
      icon={drawing ? <PencilSimple /> : <Plus />}
      pressed={drawing}
      onClick={() => setDrawing(!drawing)}
      className={className}
    >
      {!drawing ? label : short ? <><span className="sr-only">Drawing busy times</span><span aria-hidden className="max-desk:hidden">Drawing busy times</span><span aria-hidden className="desk:hidden">Drawing</span></> : "Drawing busy times"}
    </Chip>
  );
}
