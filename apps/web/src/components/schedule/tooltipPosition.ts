export interface TooltipPosition {
  left: number;
  top?: number;
  bottom?: number;
}

const WIDTH = 220;
const OFFSET_X = 8;
const GAP = 24;
const MARGIN = 8;
/** Room the tooltip needs under the block; with less, it goes above. */
const NEEDED_BELOW = 150;

/**
 * Where the block tooltip goes in the viewport (position: fixed): under the block, a little to its left
 * (div.app-19.md), above it near the bottom of the screen, and never past the sides.
 */
export function tooltipPosition(
  block: Pick<DOMRect, "left" | "top" | "bottom">,
  viewport: { width: number; height: number },
): TooltipPosition {
  const left = Math.max(MARGIN, Math.min(block.left - OFFSET_X, viewport.width - WIDTH - MARGIN));
  if (viewport.height - block.bottom - GAP >= NEEDED_BELOW) return { left, top: block.bottom + GAP };
  return { left, bottom: viewport.height - block.top + GAP };
}
