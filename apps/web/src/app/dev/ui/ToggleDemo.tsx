"use client";

import { useState } from "react";
import { Toggle } from "@/components/ui/Toggle";

export function ToggleDemo() {
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [other, setOther] = useState(false);

  return (
    <>
      <Toggle checked={onlyOpen} onCheckedChange={setOnlyOpen} label="Only open sections" />
      <Toggle checked={other} onCheckedChange={setOther} label="Only open sections" />
      <Toggle checked onCheckedChange={() => {}} label="Disabled" disabled />
    </>
  );
}
