import type { GuideStep } from "./tutorialSteps";

type Size = { width: number; height: number };
type Position = { left: number; top: number };
export type GuideRect = Size & Position;
export type GuideLandmarks = { sidebar?: GuideRect; calendar?: GuideRect; details?: GuideRect };

const GAP = 12;
const TARGET_MARGIN = 6;

function overlap(a: GuideRect, b: GuideRect): number {
  const width = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
  const height = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
  return width > 0 && height > 0 ? width * height : 0;
}

/** Where each step would like to sit, best first. The sides of the target are always tried after these. */
export function preferredPlaces(step: GuideStep, targetId: string, target: GuideRect, size: Size, { sidebar, calendar, details }: GuideLandmarks): Position[] {
  const beside = (sidebar ? sidebar.left + sidebar.width : target.left + target.width + 16) + GAP;
  const detailsRight = details ? details.left + details.width - size.width : undefined;
  switch (step) {
    case "term": return [{ left: beside, top: 178 }];
    case "courses": return [{ left: beside, top: 178 }, ...(detailsRight === undefined ? [] : [{ left: detailsRight, top: 178 }])];
    case "professor": return [{ left: (details?.left ?? target.left) - size.width - GAP, top: target.top - 82 }];
    // The calendar stays clear here, since this step asks for a drag on it.
    case "availability": return [{ left: detailsRight ?? target.left, top: target.top + target.height + GAP }];
    case "schedules": {
      if (targetId === "tutorial-diagnosis") return [{ left: (details?.left ?? target.left) - size.width - GAP, top: details?.top ?? target.top }];
      const calendarBottom = calendar ? calendar.top + calendar.height : target.top + target.height + size.height;
      return [
        { left: (calendar?.left ?? target.left) + 24, top: calendarBottom - size.height - 22 },
        ...(sidebar ? [{ left: sidebar.left, top: sidebar.top + sidebar.height - size.height }] : []),
        ...(details && detailsRight !== undefined ? [{ left: detailsRight, top: details.top + details.height - size.height }] : []),
      ];
    }
  }
}

/** Never on the target if any place avoids it; among those, the one hiding the least of `avoid`, earliest first. */
export function guidePlacement(target: GuideRect, size: Size, viewport: Size, preferred: readonly Position[], avoid: readonly GuideRect[] = []): Position {
  const clamp = (position: Position) => ({
    left: Math.max(8, Math.min(position.left, viewport.width - size.width - 8)),
    top: Math.max(8, Math.min(position.top, viewport.height - size.height - 8)),
  });
  const right = target.left + target.width;
  const bottom = target.top + target.height;
  const candidates = [
    ...preferred,
    { left: right + GAP, top: target.top },
    { left: target.left - size.width - GAP, top: target.top },
    { left: target.left, top: bottom + GAP },
    { left: target.left, top: target.top - size.height - GAP },
    { left: right + GAP, top: bottom - size.height },
    { left: target.left - size.width - GAP, top: bottom - size.height },
    { left: right - size.width, top: bottom + GAP },
    { left: right - size.width, top: target.top - size.height - GAP },
  ].map(clamp);
  const keepClear = { left: target.left - TARGET_MARGIN, top: target.top - TARGET_MARGIN, width: target.width + 2 * TARGET_MARGIN, height: target.height + 2 * TARGET_MARGIN };
  let best = candidates[0];
  let bestOnTarget = Infinity;
  let bestHidden = Infinity;
  for (const position of candidates) {
    const box = { ...position, width: size.width, height: size.height };
    const onTarget = overlap(box, keepClear);
    const hidden = avoid.reduce((total, rect) => total + overlap(box, rect), 0);
    if (onTarget < bestOnTarget || (onTarget === bestOnTarget && hidden < bestHidden)) {
      best = position;
      bestOnTarget = onTarget;
      bestHidden = hidden;
    }
  }
  return best;
}
