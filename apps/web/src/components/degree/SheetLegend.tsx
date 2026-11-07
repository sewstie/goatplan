import { TILE_LOOK, type TileState } from "./tileState";

const SHOWN: TileState[] = ["done", "progress", "planned", "check", "empty"];

export function SheetLegend() {
  return (
    <ul aria-label="What the colors mean" className="flex flex-wrap items-center gap-x-14 gap-y-6 text-8 leading-16 text-ink-muted">
      {SHOWN.map((state) => {
        const { word, Icon, ink } = TILE_LOOK[state];
        return <li key={state} className="flex items-center gap-5"><Icon aria-hidden weight="bold" className={`size-12 ${ink}`} />{word}</li>;
      })}
    </ul>
  );
}
