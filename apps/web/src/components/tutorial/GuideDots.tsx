export function GuideDots({ current, total }: { current: number; total: number }) {
  return <div className="flex items-center gap-6">
    {Array.from({ length: total }, (_, index) => <span key={index} aria-hidden data-current={index + 1 === current || undefined} className="size-6 rounded-full bg-line-strong data-current:bg-accent" />)}
    <p aria-live="polite" aria-atomic="true" className="sr-only">Step {current} of {total}</p>
  </div>;
}
