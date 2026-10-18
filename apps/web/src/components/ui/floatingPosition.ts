type Box = { width: number; height: number };

export interface FloatingOptions {
  placement?: "bottom" | "top";
  /** From the anchor's left edge; negative moves left. */
  offsetX?: number;
  /** Space between the anchor and the floating box. */
  gap?: number;
  /** Space kept from the edges of the viewport. */
  margin?: number;
}

/**
 * Where a box with position: fixed goes next to an anchor: on the preferred side when it fits there,
 * else on the other side, and never past the left or right edge.
 */
export function floatingPosition(
  anchor: Pick<DOMRect, "left" | "top" | "bottom">,
  size: Box,
  viewport: Box,
  { placement = "bottom", offsetX = 0, gap = 6, margin = 8 }: FloatingOptions = {},
): { left: number; top: number } {
  const left = Math.max(margin, Math.min(anchor.left + offsetX, viewport.width - size.width - margin));
  const below = anchor.bottom + gap;
  const above = anchor.top - gap - size.height;
  const fitsBelow = below + size.height <= viewport.height - margin;
  const fitsAbove = above >= margin;
  const top = placement === "bottom" ? (fitsBelow || !fitsAbove ? below : above) : fitsAbove || !fitsBelow ? above : below;
  return { left, top };
}
