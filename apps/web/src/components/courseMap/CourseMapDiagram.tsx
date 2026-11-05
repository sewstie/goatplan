import type { CourseMap } from "@/lib/courseMap/courseMap";
import { cx } from "@/components/ui/cx";

const BANDS = [1000, 2000, 3000, 4000];
const WIDTH = 1160;
const CELL = 136;
const LEFT = 24;
const NODE_HEIGHT = 76;

export function CourseMapDiagram({ map, selected, select }: { map: CourseMap; selected: string | null; select(code: string): void }) {
  const rows = BANDS.map((band) => {
    const nodes = map.nodes.filter((node) => node.band === band).sort((a, b) => a.code.localeCompare(b.code));
    const height = 64 + Math.max(1, Math.ceil(nodes.length / 8)) * 108;
    return { band, nodes, height };
  });
  const bands = rows.map((row, index) => ({ ...row, top: rows.slice(0, index).reduce((sum, previous) => sum + previous.height, 0) }));
  const height = rows.reduce((sum, row) => sum + row.height, 0);
  const positions = new Map(bands.flatMap((band) => band.nodes.map((node, index) => [node.code, { x: LEFT + (index % 8) * CELL, y: band.top + 48 + Math.floor(index / 8) * 108 }] as const)));
  const edges = map.connections.filter((edge) => selected === edge.from || selected === edge.to);
  const connected = new Set(edges.flatMap((edge) => [edge.from, edge.to]));

  return <div role="region" aria-label="Course-number map" tabIndex={0} className="overflow-x-auto rounded-panel border border-card-line bg-surface">
    <div className="relative" style={{ width: WIDTH, height }}>
      {bands.map((band) => <section key={band.band} aria-label={`${band.band}-level courses`} className="absolute inset-x-0 border-t border-dashed border-line-strong" style={{ top: band.top, height: band.height }}>
        <h3 className="px-24 pt-12 text-11 font-650 text-ink-muted">{band.band} level</h3>
      </section>)}
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible text-accent" aria-label="Selected course connections">
        <defs><marker id="map-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
        {edges.map((edge, index) => {
          const from = positions.get(edge.from), to = positions.get(edge.to);
          if (!from || !to) return null;
          const forward = to.y > from.y;
          const x1 = from.x + 62, x2 = to.x + 62;
          const sameRow = from.y === to.y;
          const y1 = from.y + (forward || sameRow ? NODE_HEIGHT : 0);
          const y2 = to.y + (forward && !sameRow ? 0 : NODE_HEIGHT);
          const exit = y1 + (forward || sameRow ? 12 : -12);
          const entry = y2 + (forward && !sameRow ? -12 : 12);
          const lane = 1112 + (index % 10) * 4;
          const route = sameRow
            ? `M${x1},${y1} V${exit} H${x2} V${y2}`
            : `M${x1},${y1} V${exit} H${lane} V${entry} H${x2} V${y2}`;
          return <path key={`${edge.from}-${edge.to}`} role="img" aria-label={`${edge.from} → ${edge.to}`} d={route} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" markerEnd="url(#map-arrow)" />;
        })}
      </svg>
      {bands.flatMap((band) => band.nodes.map((node) => {
        const position = positions.get(node.code)!;
        return <button key={node.code} type="button" aria-label={node.code} aria-pressed={selected === node.code} onClick={() => select(node.code)} style={{ left: position.x, top: position.y, width: 124, height: NODE_HEIGHT }} className={cx("absolute flex cursor-pointer flex-col items-start justify-center gap-4 rounded-card border px-10 text-left hover:border-accent hover:bg-accent-soft focus-visible:z-10", selected === node.code ? "border-accent bg-accent-soft ring-2 ring-accent" : connected.has(node.code) ? "border-accent bg-surface-selected" : "border-line-strong bg-surface")}>
          <span className="text-10 font-700 text-ink">{node.code}</span>
          <span className="line-clamp-2 text-8 leading-13 text-ink-soft">{node.offering?.title ?? node.title}</span>
          {!node.offering && <span className="text-7 leading-11 text-ink-muted">No offering details</span>}
        </button>;
      }))}
    </div>
  </div>;
}
