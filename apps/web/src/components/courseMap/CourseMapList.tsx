import type { CourseMap } from "@/lib/courseMap/courseMap";
import { BackgroundExpression } from "./BackgroundExpression";

export function CourseMapList({ map, selected, select }: { map: CourseMap; selected: string | null; select(code: string): void }) {
  return <div className="flex flex-col gap-18">
    {[1000, 2000, 3000, 4000].map((band) => <section key={band} aria-label={`${band}-level courses`} className="rounded-panel border border-card-line bg-surface p-18">
      <h3 className="pb-12 text-14 font-650">{band} level</h3>
      <ul className="divide-y divide-line">{map.nodes.filter((node) => node.band === band).sort((a, b) => a.code.localeCompare(b.code)).map((node) => <li key={node.code} className="flex flex-col items-start gap-8 py-12 text-10 leading-18 text-ink-soft">
        <button type="button" aria-label={node.code} aria-pressed={selected === node.code} onClick={() => select(node.code)} className="min-h-44 cursor-pointer rounded-row px-10 font-650 text-accent hover:bg-accent-soft">{node.code}</button>
        <p className="font-600 text-ink">{node.offering?.title ?? node.title}</p>
        {node.background && <p><BackgroundExpression value={node.background} /></p>}
        <p className="whitespace-pre-line">{node.wording}</p>
        {!node.offering && <p>Offering details are unavailable in the loaded term data. This does not mean the course has no background or will not be offered.</p>}
        <a className="text-accent underline" href={node.source} target="_blank" rel="noreferrer">{node.backgroundCurated ? "Catalog source for" : "Source mentioning"} {node.code}</a>
        <p>Used as background by: {map.connections.filter((edge) => edge.from === node.code).map((edge) => edge.to).join(", ") || "No connections recorded in this map."}</p>
      </li>)}</ul>
    </section>)}
  </div>;
}
