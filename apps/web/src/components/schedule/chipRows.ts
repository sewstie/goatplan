export type ChipSize = { width: number; height: number };

/** How tall a row of chips gets once it wraps to `width`, filling each row before starting the next. */
export function wrappedHeight(chips: readonly ChipSize[], width: number, gapX: number, gapY: number): number {
  let total = 0;
  let rowWidth = 0;
  let rowHeight = 0;
  for (const chip of chips) {
    if (rowWidth > 0 && rowWidth + gapX + chip.width > width) {
      total += rowHeight + gapY;
      rowWidth = 0;
      rowHeight = 0;
    }
    rowWidth += (rowWidth > 0 ? gapX : 0) + chip.width;
    rowHeight = Math.max(rowHeight, chip.height);
  }
  return total + rowHeight;
}
