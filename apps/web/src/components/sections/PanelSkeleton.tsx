const CARD_BARS = ["w-199", "w-162", "w-104"];

/** The panel while the term loads (div.app-1.md). */
export function PanelSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-15 pt-10">
      <div className="h-22 w-131 rounded-badge bg-skeleton" />
      <div className="h-10 w-219 max-w-full rounded-badge bg-skeleton" />
      {[0, 1, 2].map((card) => (
        <div key={card} className="flex flex-col gap-10 rounded-card border border-line px-10 pt-30 pb-25">
          {CARD_BARS.map((width) => (
            <div key={width} className={`h-10 max-w-full rounded-badge bg-skeleton ${width}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
