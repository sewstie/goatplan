export function CalendarCaption({ left, dayCount }: { left: string; dayCount: number }) {
  return (
    <div className="flex shrink-0 justify-between gap-12 pt-3 pr-12 pb-10 pl-(--size-time-axis) text-8 leading-11-6 text-ink-muted">
      <p>{left}</p>
      <p>{dayCount > 5 ? `${dayCount} days` : "Monday–Friday"}</p>
    </div>
  );
}
