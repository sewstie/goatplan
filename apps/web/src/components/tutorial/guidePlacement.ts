type Size = { width: number; height: number };
type Position = { left: number; top: number };
export type GuideRect = Size & Position;

export function guidePlacement(target: GuideRect, size: Size, viewport: Size, preferred: Position): Position {
  const clamp = (position: Position) => ({
    left: Math.max(8, Math.min(position.left, viewport.width - size.width - 8)),
    top: Math.max(8, Math.min(position.top, viewport.height - size.height - 8)),
  });
  const candidates = [
    preferred,
    { left: target.left + target.width + 12, top: target.top },
    { left: target.left - size.width - 12, top: target.top },
    { left: target.left, top: target.top + target.height + 12 },
    { left: target.left, top: target.top - size.height - 12 },
  ].map(clamp);
  return candidates.find((position) => position.left >= target.left + target.width + 6
    || position.left + size.width <= target.left - 6
    || position.top >= target.top + target.height + 6
    || position.top + size.height <= target.top - 6) ?? clamp(preferred);
}
