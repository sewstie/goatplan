const ROWS = 8;

export function DegreeSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-14 desk:grid desk:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] desk:items-start desk:gap-16">
      <p className="sr-only">Checking your progress…</p>
      <div aria-hidden className="h-144 rounded-panel bg-surface desk:order-last" />
      <ul aria-hidden className="flex flex-col gap-14 rounded-panel bg-surface p-22">
        {Array.from({ length: ROWS }, (_, key) => (
          <li key={key} className="h-44 rounded-card bg-skeleton" />
        ))}
      </ul>
    </div>
  );
}
