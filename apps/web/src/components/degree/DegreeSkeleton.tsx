const RINGS = 8;

export function DegreeSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-22">
      <p className="sr-only">Checking your progress…</p>
      <div aria-hidden className="h-96 rounded-panel bg-surface" />
      <ul aria-hidden className="flex flex-col gap-14 rounded-panel bg-surface p-22">
        {Array.from({ length: RINGS }, (_, key) => (
          <li key={key} className="h-44 rounded-card bg-skeleton" />
        ))}
      </ul>
    </div>
  );
}
