import type { CourseMap } from "@/lib/courseMap/courseMap";
import type { DegreeHistory } from "@/lib/degree";
import { cx } from "@/components/ui/cx";

export function DegreeMapDiagram({ map, history, selected, select }: { map: CourseMap; history: DegreeHistory; selected: string | null; select(code: string): void }) {
  let top = 0;
  const bands = [1000, 2000, 3000, 4000].map((band) => {
    const nodes = map.nodes.filter((node) => node.band === band).sort((a, b) => a.code.localeCompare(b.code));
    if (band === 2000) nodes.sort((a, b) => ["CS 2102", "CS 2103", "CS 2022", "CS 2303", "CS 2223"].indexOf(a.code) - ["CS 2102", "CS 2103", "CS 2022", "CS 2303", "CS 2223"].indexOf(b.code));
    const height = nodes.length > 3 ? 210 : 90;
    const row = { band, nodes, top, height };
    top += height;
    return row;
  });
  const positions = new Map(bands.flatMap((band) => band.nodes.map((node, index) => [node.code, { x: 145 + index % 3 * 270, y: band.top + 18 + Math.floor(index / 3) * 122 }] as const)));
  return <div className="degree-map-diagram" role="region" aria-label="Course-number map" tabIndex={0}>
    <div className="degree-map-diagram-inner" style={{ height: top }}>
      {bands.map((band) => <div key={band.band} className="degree-map-diagram-band" style={{ top: band.top, height: band.height }}><h3>{band.band} level</h3></div>)}
      <svg viewBox={`0 0 1000 ${top}`} preserveAspectRatio="none" aria-label="Selected course connections" className="degree-map-connections">
        <defs><marker id="degree-map-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10" fill="none" stroke="currentColor" strokeWidth="2" /></marker></defs>
        {map.connections.filter((edge) => !selected || edge.from === selected || edge.to === selected).map((edge) => {
          const from = positions.get(edge.from), to = positions.get(edge.to);
          if (!from || !to) return null;
          const x1 = from.x + 110, x2 = to.x + 110, y1 = from.y + 53, y2 = to.y;
          const same = from.y === to.y;
          const bend = same ? y1 + 30 : (y1 + y2) / 2;
          return <path key={`${edge.from}-${edge.to}`} role="img" aria-label={`${edge.from} → ${edge.to}`} d={`M${x1},${y1} C${x1},${bend} ${x2},${bend} ${x2},${same ? y1 : y2}`} fill="none" stroke="currentColor" strokeWidth="2" markerEnd="url(#degree-map-arrow)" />;
        })}
      </svg>
      {map.nodes.map((node) => {
        const position = positions.get(node.code)!;
        const state = history.courses.find((course) => course.code === node.code)?.status ?? "needed";
        return <button key={node.code} type="button" aria-label={node.code} aria-pressed={selected === node.code} onClick={() => select(node.code)} style={{ left: `${position.x / 10}%`, top: position.y, width: "23%" }} className={cx("degree-map-node degree-map-positioned", `degree-map-${state}`, selected === node.code && "degree-map-node-selected")}><strong>{node.code}</strong><span>{state === "taken" ? "✓ Taken" : state === "planned" ? "◌ Planned" : "+ Still needed"}</span></button>;
      })}
    </div>
  </div>;
}
