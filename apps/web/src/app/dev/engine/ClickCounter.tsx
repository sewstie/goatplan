"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/** Click it while the engine works: if the count goes up right away, the page isn't frozen. */
export function ClickCounter() {
  const [count, setCount] = useState(0);
  return (
    <Button variant="secondary" size="md" onClick={() => setCount((value) => value + 1)}>
      Clicks: {count}
    </Button>
  );
}
