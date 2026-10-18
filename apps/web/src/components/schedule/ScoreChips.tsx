/** What the shown schedule is like: days on campus, gaps and early classes. White like the preference pills, so they show on the canvas. */
export function ScoreChips({ chips }: { chips: readonly string[] }) {
  return (
    <ul aria-label="This schedule" className="flex flex-wrap gap-4">
      {chips.map((chip) => (
        <li key={chip} className="rounded-pill bg-surface px-7 py-1 text-8-5 leading-11-9 font-570 whitespace-nowrap text-ink-muted">
          {chip}
        </li>
      ))}
    </ul>
  );
}
