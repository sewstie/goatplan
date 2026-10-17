"use client";

import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";

export function TooltipDemo() {
  return (
    <Tooltip
      content={
        <span className="flex flex-col gap-2.75">
          <span className="text-11 leading-15-95 font-700">AE 2410 · C01</span>
          <span className="pt-3 pb-5">Introduction to Aerospace Structures</span>
          <span className="text-9 leading-15-3 text-ink-muted">Tue · 10:00–10:50 AM</span>
          <span className="text-9 leading-15-3 text-ink-muted">Higgins Labs 116 · Mark Richman</span>
        </span>
      }
    >
      <Button variant="secondary" size="md">
        Hover or focus me
      </Button>
    </Tooltip>
  );
}
