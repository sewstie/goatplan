"use client";

import { Moon, Sun } from "@phosphor-icons/react/ssr";
import { IconButton } from "@/components/ui/IconButton";
import { useTheme } from "@/lib/theme";

export function ThemeButton() {
  const { dark, toggle } = useTheme();
  return (
    <IconButton
      label={dark ? "Switch to light theme" : "Switch to dark theme"}
      icon={dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
      onClick={toggle}
      className="size-36 [&_svg]:size-16"
    />
  );
}
