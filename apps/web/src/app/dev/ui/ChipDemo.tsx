"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react/ssr";
import { Chip } from "@/components/ui/Chip";

export function ChipDemo() {
  const [blocks, setBlocks] = useState(1);

  return (
    <>
      <Chip label="Starts after" value="9:00 AM" />
      {Array.from({ length: blocks }, (_, index) => (
        <Chip
          key={index}
          label="Blocked"
          value="Work"
          detail="· Tue, Fri 2 PM–4 PM"
          onRemove={() => setBlocks((count) => count - 1)}
          removeLabel="Remove Work block"
        />
      ))}
      <Chip variant="dashed" icon={<Plus />} onClick={() => setBlocks((count) => count + 1)}>
        Block a time
      </Chip>
    </>
  );
}
