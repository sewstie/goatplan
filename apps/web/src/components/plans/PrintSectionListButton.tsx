"use client";

import { Printer } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";

export function PrintSectionListButton() {
  return (
    <Button size="md" variant="secondary" icon={<Printer aria-hidden />} onClick={() => window.print()}>
      Print
    </Button>
  );
}
