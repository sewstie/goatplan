import type { MouseEvent } from "react";

export function keepClickFocus(event: MouseEvent) {
  if (!(event.target as Element).closest("button, a, input, select, textarea, summary")) event.preventDefault();
}
