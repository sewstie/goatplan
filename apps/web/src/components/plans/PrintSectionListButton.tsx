"use client";

import { Printer } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";

export function PrintSectionListButton() {
  return (
    <Button variant="secondary" size="md" icon={<Printer aria-hidden />} onClick={() => window.print()} className="w-70">
      Print
    </Button>
  );
}
