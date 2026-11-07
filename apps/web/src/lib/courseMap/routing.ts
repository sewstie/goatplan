import type { FlowEdge, Flowchart } from "./flowchart";

export type Point = [number, number];

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RoutedEdge extends FlowEdge {
  points: Point[];
}

export interface FlowLayout {
  width: number;
  height: number;
  boxes: Record<string, Box>;
  pairs: Record<string, Box>;
  badges: Record<string, Box>;
  edges: RoutedEdge[];
  bands: { band: number; top: number; line: number | null }[];
}

export const SIZE = {
  card: 132,
  cardHeight: 80,
  lane: 7,
  gutterPad: 9,
  minGutter: 30,
  channelPad: 12,
  minChannel: 36,
  rail: 64,
  pad: 16,
  pairPad: 5,
  bandGap: 14,
  nudge: 18,
  badge: 22,
  sideShift: 12,
};

type Port = { id: string; row: number; x: number; pair: boolean; col: number };
type Plan =
  | { kind: "beside"; edge: FlowEdge; port: Port }
  | { kind: "below"; edge: FlowEdge; port: Port }
  | { kind: "gutter"; edge: FlowEdge; port: Port; gutter: number };

function lanes<T>(items: { key: string; from: number; to: number; item?: T }[]) {
  const spans = new Map<string, { from: number; to: number }>();
  for (const { key, from, to } of items) {
    const old = spans.get(key);
    spans.set(key, old ? { from: Math.min(old.from, from), to: Math.max(old.to, to) } : { from, to });
  }
  const ends: number[] = [];
  const result = new Map<string, number>();
  for (const [key, span] of [...spans].sort((a, b) => a[1].from - b[1].from || a[1].to - b[1].to)) {
    let lane = ends.findIndex((end) => end < span.from);
    if (lane === -1) lane = ends.length;
    ends[lane] = span.to;
    result.set(key, lane);
  }
  return { lane: result, count: ends.length };
}

export function routeFlowchart(flow: Flowchart, size = SIZE): FlowLayout {
  const course = new Map(flow.courses.map((item) => [item.code, item]));
  const pair = new Map(flow.pairs.map((item) => [item.id, item]));
  const cell = new Map(flow.courses.map((item) => [`${item.row}:${item.col}`, item.code]));
  const blocked = (gutter: number, row: number) => flow.pairs.some((item) => item.row === row && item.col + 1 === gutter);
  const portOf = (id: string): Port => {
    const joined = pair.get(id);
    if (joined) return { id, row: joined.row, x: joined.col + 1, pair: true, col: joined.col };
    const single = course.get(id)!;
    return { id, row: single.row, x: single.col + 0.5, pair: false, col: single.col };
  };

  const plans: Plan[] = flow.edges.map((edge) => {
    const port = portOf(edge.from);
    const target = course.get(edge.to)!;
    if (target.row === port.row) {
      const neighbour = port.pair ? target.col === port.col - 1 || target.col === port.col + 2 : Math.abs(target.col - port.col) === 1;
      if (!neighbour) throw new Error(`${edgeName(edge)} needs neighbouring courses in one row`);
      return { kind: "beside", edge, port };
    }
    if (target.row < port.row) throw new Error(`${edgeName(edge)} points up the map`);
    if (target.row === port.row + 1) return { kind: "below", edge, port };
    const free = [target.col, target.col + 1].filter((gutter) => {
      for (let row = port.row + 1; row <= target.row; row += 1) if (blocked(gutter, row)) return false;
      return true;
    });
    if (free.length === 0) throw new Error(`${edgeName(edge)} has no free gap to travel down`);
    const gutter = free.sort((a, b) => Math.abs(a - port.x) - Math.abs(b - port.x) || b - a)[0];
    return { kind: "gutter", edge, port, gutter };
  });

  const entering = new Map<string, Set<string>>();
  for (const plan of plans) if (plan.kind === "below") entering.set(plan.edge.to, new Set([...(entering.get(plan.edge.to) ?? []), plan.port.id]));
  const nudged = new Set(flow.courses.filter((item) => {
    const below = cell.get(`${item.row + 1}:${item.col}`);
    return below && [...(entering.get(below) ?? [])].some((id) => id !== item.code) && plans.some((plan) => plan.kind !== "beside" && plan.port.id === item.code);
  }).map((item) => item.code));

  const channelItems = new Map<number, { key: string; from: number; to: number }[]>();
  const gutterItems = new Map<number, { key: string; from: number; to: number }[]>();
  for (const plan of plans) {
    if (plan.kind === "beside") continue;
    const target = course.get(plan.edge.to)!;
    const end = plan.kind === "below" ? target.col + 0.5 : plan.gutter;
    const start = plan.port.x + (nudged.has(plan.port.id) ? 0.15 : 0);
    if (plan.kind === "below" && start === end) continue;
    channelItems.set(plan.port.row, [...(channelItems.get(plan.port.row) ?? []), { key: plan.port.id, from: Math.min(start, end), to: Math.max(start, end) }]);
    if (plan.kind === "gutter") gutterItems.set(plan.gutter, [...(gutterItems.get(plan.gutter) ?? []), { key: plan.port.id, from: plan.port.row + 0.5, to: target.row }]);
  }
  const channels = Array.from({ length: flow.rows }, (_, row) => lanes(channelItems.get(row) ?? []));
  const gutters = Array.from({ length: flow.cols + 1 }, (_, gutter) => lanes(gutterItems.get(gutter) ?? []));

  const bandOfRow = (row: number) => flow.courses.find((item) => item.row === row)?.band ?? 0;
  const gutterWidth = gutters.map((gutter) => Math.max(size.minGutter, gutter.count * size.lane + 2 * size.gutterPad));
  const gutterLeft: number[] = [];
  const colX: number[] = [];
  let x = size.rail;
  for (let col = 0; col <= flow.cols; col += 1) {
    gutterLeft[col] = x;
    x += gutterWidth[col];
    colX[col] = x;
    x += size.card;
  }
  const width = gutterLeft[flow.cols] + gutterWidth[flow.cols] + size.pad;
  const rowY: number[] = [];
  const channelTop: number[] = [];
  let y = size.pad;
  for (let row = 0; row < flow.rows; row += 1) {
    rowY[row] = y;
    channelTop[row] = y + size.cardHeight + (flow.pairs.some((item) => item.row === row) ? size.pairPad : 0);
    const lanesHeight = Math.max(size.minChannel, channels[row].count * size.lane + 2 * size.channelPad);
    const bandChange = row + 1 < flow.rows && bandOfRow(row + 1) !== bandOfRow(row);
    y += size.cardHeight + lanesHeight + (bandChange ? size.bandGap : 0);
  }
  const height = rowY[flow.rows - 1] + size.cardHeight + size.pad;

  const boxes: Record<string, Box> = {};
  for (const item of flow.courses) boxes[item.code] = { x: colX[item.col], y: rowY[item.row], w: size.card, h: size.cardHeight };
  const pairs: Record<string, Box> = {};
  const badges: Record<string, Box> = {};
  for (const item of flow.pairs) {
    const [first, second] = item.codes.map((code) => boxes[code]);
    pairs[item.id] = { x: first.x - size.pairPad, y: first.y - size.pairPad, w: second.x + second.w - first.x + 2 * size.pairPad, h: first.h + 2 * size.pairPad };
    const middle = gutterLeft[item.col + 1] + gutterWidth[item.col + 1] / 2;
    badges[item.id] = { x: middle - size.badge / 2, y: first.y + first.h / 2 - size.badge / 2, w: size.badge, h: size.badge };
  }

  const laneY = (row: number, id: string) => {
    const { lane, count } = channels[row];
    const room = Math.max(size.minChannel, count * size.lane + 2 * size.channelPad) - (channelTop[row] - rowY[row] - size.cardHeight);
    return channelTop[row] + room / 2 + ((lane.get(id) ?? 0) - (count - 1) / 2) * size.lane;
  };
  const laneX = (gutter: number, id: string) => {
    const { lane, count } = gutters[gutter];
    return gutterLeft[gutter] + gutterWidth[gutter] / 2 + ((lane.get(id) ?? 0) - (count - 1) / 2) * size.lane;
  };
  const exitOf = (port: Port): Point => {
    if (port.pair) {
      const box = pairs[port.id];
      return [gutterLeft[port.col + 1] + gutterWidth[port.col + 1] / 2, box.y + box.h];
    }
    const box = boxes[port.id];
    return [box.x + box.w / 2 + (nudged.has(port.id) ? size.nudge : 0), box.y + box.h];
  };

  const edges = plans.map((plan): RoutedEdge => {
    const target = boxes[plan.edge.to];
    const middle = target.y + target.h / 2;
    if (plan.kind === "beside") {
      const source = plan.port.pair ? pairs[plan.port.id] : boxes[plan.port.id];
      const right = target.x > source.x;
      return { ...plan.edge, points: [[right ? source.x + source.w : source.x, middle], [right ? target.x : target.x + target.w, middle]] };
    }
    const [ex, ey] = exitOf(plan.port);
    const ly = laneY(plan.port.row, plan.port.id);
    if (plan.kind === "below") {
      const tx = target.x + target.w / 2;
      return { ...plan.edge, points: ex === tx ? [[ex, ey], [tx, target.y]] : [[ex, ey], [ex, ly], [tx, ly], [tx, target.y]] };
    }
    const gx = laneX(plan.gutter, plan.port.id);
    const fromLeft = gx < target.x;
    const entry = middle + (fromLeft ? size.sideShift : -size.sideShift);
    return { ...plan.edge, points: [[ex, ey], [ex, ly], [gx, ly], [gx, entry], [fromLeft ? target.x : target.x + target.w, entry]] };
  });

  const bands = Array.from({ length: flow.rows }, (_, row) => row)
    .filter((row) => row === 0 || bandOfRow(row) !== bandOfRow(row - 1))
    .map((row) => ({ band: bandOfRow(row), top: rowY[row], line: row === 0 ? null : rowY[row] - size.bandGap / 2 - (flow.pairs.some((item) => item.row === row) ? size.pairPad : 0) }));

  return { width, height, boxes, pairs, badges, edges, bands };
}

function edgeName(edge: FlowEdge) {
  return `${edge.from} → ${edge.to}`;
}
