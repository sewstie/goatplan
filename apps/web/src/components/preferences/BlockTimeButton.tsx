"use client";

import { PencilSimple, Plus } from "@phosphor-icons/react/ssr";
import { Chip } from "@/components/ui/Chip";
import { usePlanner } from "@/lib/store";

/**
 * The dashed "Block a time" pill: it turns drawing mode on and off. The drawing bar above the
 * calendar has the form for typing a time instead.
 */
export function BlockTimeButton({ label = "Block a time", className }: { label?: string; className?: string } = {}) {
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
      {drawing ? "Drawing busy times" : label}
    </Chip>
  );
}
