"use client";

import { Toggle } from "@/components/ui/Toggle";
import { useTheme } from "@/lib/theme";

export function ThemeSwitch() {
  const { dark, toggle } = useTheme();
  return <Toggle label="Dark theme" checked={dark} onCheckedChange={toggle} className="px-8" />;
}
