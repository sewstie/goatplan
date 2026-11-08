"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkle } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import type { DegreeSnapshot } from "@/lib/degree";
import { NextTermsPanel } from "./NextTermsPanel";

export function NextTermsSuggestions({ degree, startYear, blocks }: { degree: DegreeSnapshot; startYear: number; blocks: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => { if (!open) trigger.current?.focus(); }, [open]);
  if (degree.selectedSheetId !== "cs-2030") return null;
  return <>
    <Button variant="secondary" size="sm" icon={<Sparkle aria-hidden />} onClick={(event) => { trigger.current = event.currentTarget; setOpen(true); }}>Suggest next terms</Button>
    <Drawer open={open} onClose={() => setOpen(false)}>{open && <NextTermsPanel degree={degree} startYear={startYear} blocks={blocks} onClose={() => setOpen(false)} />}</Drawer>
  </>;
}
