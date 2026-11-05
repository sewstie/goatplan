import type { CourseMap, MapNode } from "@/lib/courseMap/courseMap";
import { Sheet } from "@/components/ui/Sheet";
import { BackgroundExpression } from "./BackgroundExpression";

export function MapCourseDetails({ node, map, close, select }: { node: MapNode | null; map: CourseMap; close(): void; select(code: string): void }) {
  return (
    <Sheet open={node !== null} title={node?.code ?? "Course background"} focusKey={node?.code} onClose={close}>
      {node && <div className="flex flex-col gap-16 text-10 leading-18 text-ink-soft">
        <p className="text-14 font-600 text-ink">{node.offering?.title ?? node.title}</p>
        {node.aliases && <p>Also listed as {node.aliases.join(" / ")}</p>}
        <section aria-label="Recommended background" className="flex flex-col gap-10">
          <h3 className="font-650 text-ink">{node.backgroundCurated ? "Recommended background" : "Connected course"}</h3>
          {node.background && <p><BackgroundExpression value={node.background} /></p>}
          <p className="whitespace-pre-line border-l-2 border-accent pl-12">{node.wording}</p>
          <a className="text-accent underline" href={node.source} target="_blank" rel="noreferrer">{node.backgroundCurated ? "Catalog source" : "Source mentioning this course"}</a>
        </section>
        <p>These connections describe background. They do not establish prerequisites or enrollment eligibility.</p>
        {node.offering ? <section aria-label="Course description"><h3 className="pb-8 font-650 text-ink">Course description</h3><p>{node.offering.description}</p></section> : <p className="rounded-card bg-canvas p-12">Offering details are unavailable in the loaded term data. This does not mean the course has no background or will not be offered.</p>}
        {(["incoming", "outgoing"] as const).map((direction) => {
          const related = map.connections.filter((edge) => direction === "incoming" ? edge.to === node.code : edge.from === node.code).map((edge) => direction === "incoming" ? edge.from : edge.to);
          return <section key={direction} aria-label={direction === "incoming" ? "Background courses" : "Courses using this background"}>
            <h3 className="pb-8 font-650 text-ink">{direction === "incoming" ? "Background courses" : "Courses using this background"}</h3>
            {related.length ? <div className="flex flex-wrap gap-8">{related.map((code) => <button key={code} type="button" onClick={() => select(code)} className="min-h-44 cursor-pointer rounded-row border border-line-strong px-12 font-600 text-accent hover:bg-accent-soft">{code}</button>)}</div> : <p>No connections recorded in this map.</p>}
          </section>;
        })}
      </div>}
    </Sheet>
  );
}
