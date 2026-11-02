const RADIUS = 23;
const LENGTH = 2 * Math.PI * RADIUS;

/** The ring around the number of lines done, with planned lines in the lighter color after them. */
export function ProgressRing({ done, planned, total }: { done: number; planned: number; total: number }) {
  const doneShare = total > 0 ? (done / total) * LENGTH : 0;
  const plannedShare = total > 0 ? (planned / total) * LENGTH : 0;
  return (
    <span className="relative flex size-54 shrink-0 items-center justify-center">
      <svg aria-hidden viewBox="0 0 54 54" className="absolute inset-0 -rotate-90">
        <circle cx="27" cy="27" r={RADIUS} fill="none" className="stroke-track" strokeWidth="4" />
        <circle cx="27" cy="27" r={RADIUS} fill="none" className="stroke-chart-planned" strokeWidth="4" strokeDasharray={`${doneShare + plannedShare} ${LENGTH}`} />
        <circle cx="27" cy="27" r={RADIUS} fill="none" className="stroke-accent" strokeWidth="4" strokeDasharray={`${doneShare} ${LENGTH}`} />
      </svg>
      <span className="text-17 leading-20-35 font-700 text-accent tablet:text-21">{done}</span>
    </span>
  );
}
