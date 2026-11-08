import { courseCodes, sources, type Background, type MapSource } from "./courseMap";
import { CS_LAYOUT, type AreaId, type MapLayout } from "./csLayout";

export interface FlowCourse {
  code: string;
  title: string;
  aliases: string[];
  row: number;
  col: number;
  band: number;
  area: AreaId | null;
  extras: string[];
  pair: string | null;
}

export interface FlowPair {
  id: string;
  codes: [string, string];
  row: number;
  col: number;
}

export interface FlowEdge {
  from: string;
  to: string;
  optional: boolean;
}

export interface Flowchart {
  courses: FlowCourse[];
  pairs: FlowPair[];
  edges: FlowEdge[];
  links: FlowEdge[];
  hidden: string[];
  rows: number;
  cols: number;
}

export interface Chain {
  nodes: Set<string>;
  edges: Set<string>;
  before: Set<string>;
  after: Set<string>;
}

export function extraText(extras: string[]) {
  const needed = extras.filter((extra) => !extra.startsWith("or "));
  const instead = extras.filter((extra) => extra.startsWith("or "));
  return [needed.length ? `+ ${needed.join(", ")}` : "", ...instead].filter(Boolean).join(" · ");
}

export const edgeKey = (edge: { from: string; to: string }) => `${edge.from} → ${edge.to}`;

const bandOf = (code: string) => Math.floor(Number(code.split(" ")[1]) / 1000) * 1000;
const unique = <T,>(items: T[]) => [...new Set(items)];

function alternatives(value: Background): Background[] {
  return "any" in value ? value.any.flatMap(alternatives) : [value];
}

function shorten(codes: string[]) {
  const parts: string[] = [];
  for (const code of codes) {
    const [subject, number] = code.split(" ");
    const last = parts.at(-1);
    if (last?.startsWith(`${subject} `)) parts[parts.length - 1] = `${last}/${number}`;
    else parts.push(code);
  }
  return parts.join(" or ");
}

function extrasOf(value: Background | null, shown: Set<string>): string[] {
  const outside = (code: string) => !shown.has(code);
  if (!value || "note" in value) return [];
  if ("course" in value) return outside(value.course) ? [value.course] : [];
  if ("all" in value) return value.all.flatMap((part) => extrasOf(part, shown));
  const codes = unique(alternatives(value).flatMap(courseCodes));
  const extra = codes.filter(outside);
  if (extra.length === 0) return [];
  return [`${codes.length > extra.length ? "or " : ""}${shorten(extra)}`];
}

function linksOf(value: Background | null, shown: Set<string>, pairs: FlowPair[]): Omit<FlowEdge, "to">[] {
  if (!value || "note" in value) return [];
  if ("course" in value) return shown.has(value.course) ? [{ from: value.course, optional: false }] : [];
  if ("all" in value) return value.all.flatMap((part) => linksOf(part, shown, pairs));
  let ports = unique(alternatives(value).flatMap(courseCodes).filter((code) => shown.has(code)));
  for (const pair of pairs) {
    if (pair.codes.every((code) => ports.includes(code))) ports = [...ports.filter((code) => !pair.codes.includes(code)), pair.id];
  }
  return ports.map((from) => ({ from, optional: ports.length > 1 }));
}

function merge(edges: FlowEdge[]) {
  const found = new Map<string, FlowEdge>();
  for (const edge of edges) {
    const old = found.get(edgeKey(edge));
    found.set(edgeKey(edge), old ? { ...old, optional: old.optional && edge.optional } : edge);
  }
  return [...found.values()];
}

function withoutShortcuts(edges: FlowEdge[], joins: FlowEdge[]) {
  const next = new Map<string, string[]>();
  for (const edge of [...edges, ...joins]) if (!edge.optional) next.set(edge.from, [...(next.get(edge.from) ?? []), edge.to]);
  const reached = new Map<string, Set<string>>();
  const reach = (node: string): Set<string> => {
    const known = reached.get(node);
    if (known) return known;
    const found = new Set<string>();
    reached.set(node, found);
    for (const child of next.get(node) ?? []) {
      found.add(child);
      for (const later of reach(child)) found.add(later);
    }
    return found;
  };
  return edges.filter((edge) => !(next.get(edge.from) ?? []).some((step) => step !== edge.to && reach(step).has(edge.to)));
}

export function pairJoins(flow: Pick<Flowchart, "pairs">): FlowEdge[] {
  return flow.pairs.flatMap((pair) => pair.codes.map((code) => ({ from: code, to: pair.id, optional: false })));
}

export function buildFlowchart(records: readonly MapSource[] = sources, layout: MapLayout = CS_LAYOUT): Flowchart {
  const byCode = new Map(records.map((record) => [record.code, record]));
  const place = new Map<string, { row: number; col: number }>();
  layout.rows.forEach((row, rowIndex) => row.forEach((code, col) => {
    if (!code) return;
    if (!byCode.has(code)) throw new Error(`${code} is placed on the map but has no catalog entry`);
    place.set(code, { row: rowIndex, col });
  }));
  const pairs = layout.pairs.map((codes): FlowPair => {
    const [first, second] = codes.map((code) => place.get(code));
    if (!first || !second || first.row !== second.row || second.col !== first.col + 1) throw new Error(`${codes.join(" and ")} must sit side by side`);
    return { id: codes.join(" or "), codes, row: first.row, col: first.col };
  });
  const shown = new Set(place.keys());
  const courses = [...place].map(([code, spot]): FlowCourse => {
    const record = byCode.get(code)!;
    return {
      code,
      title: record.title,
      aliases: record.aliases ?? [],
      ...spot,
      band: bandOf(code),
      area: layout.areas[code] ?? null,
      extras: extrasOf(record.background, shown),
      pair: pairs.find((pair) => pair.codes.includes(code))?.id ?? null,
    };
  });
  const raw = merge(courses.flatMap((course) => linksOf(byCode.get(course.code)!.background, shown, pairs).map((link) => ({ ...link, to: course.code }))));
  const links = merge(courses.flatMap((course) => courseCodes(byCode.get(course.code)!.background).filter((code) => shown.has(code)).map((from) => ({ from, to: course.code, optional: false }))));
  return {
    courses,
    pairs,
    edges: withoutShortcuts(raw, pairJoins({ pairs })),
    links,
    hidden: records.filter((record) => !shown.has(record.code)).map((record) => record.code),
    rows: layout.rows.length,
    cols: Math.max(...layout.rows.map((row) => row.length)),
  };
}

export function chainOf(flow: Flowchart, code: string): Chain {
  const all = [...flow.edges, ...pairJoins(flow)];
  const walk = (start: string, step: (node: string) => string[]) => {
    const seen = new Set<string>();
    const queue = [start];
    while (queue.length) for (const node of step(queue.shift()!)) if (!seen.has(node)) { seen.add(node); queue.push(node); }
    return seen;
  };
  const before = walk(code, (node) => all.filter((edge) => edge.to === node).map((edge) => edge.from));
  const after = walk(code, (node) => all.filter((edge) => edge.from === node).map((edge) => edge.to));
  const edges = new Set(flow.edges.filter((edge) =>
    (before.has(edge.from) && (before.has(edge.to) || edge.to === code)) || ((edge.from === code || after.has(edge.from)) && after.has(edge.to)),
  ).map(edgeKey));
  return { nodes: new Set([code, ...before, ...after]), edges, before, after };
}
