import { edgeKey, type Chain } from "@/lib/courseMap/flowchart";
import { roundedPath } from "@/lib/courseMap/roundedPath";
import type { RoutedEdge } from "@/lib/courseMap/routing";
import { cx } from "@/components/ui/cx";

export function FlowLines({ edges, width, height, chain }: { edges: RoutedEdge[]; width: number; height: number; chain: Chain | null }) {
  const lit = (edge: RoutedEdge) => chain?.edges.has(edgeKey(edge)) ?? false;
  const ordered = [...edges].sort((a, b) => Number(lit(a)) - Number(lit(b)));
  return (
    <svg className="flow-lines" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <defs>
        <marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" className="flow-arrow" />
        </marker>
        <marker id="flow-arrow-lit" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" className="flow-arrow-lit" />
        </marker>
      </defs>
      {ordered.map((edge) => {
        const on = lit(edge);
        return (
          <path
            key={edgeKey(edge)}
            data-edge={edgeKey(edge)}
            d={roundedPath(edge.points)}
            className={cx("flow-line", edge.optional && "flow-line-optional", on && "flow-line-lit", chain && !on && "flow-dimmed")}
            markerEnd={`url(#${on ? "flow-arrow-lit" : "flow-arrow"})`}
          />
        );
      })}
    </svg>
  );
}
