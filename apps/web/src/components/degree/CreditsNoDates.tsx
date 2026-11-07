import { formatUnits, type CreditsPerTerm } from "@/lib/degree";

function Row({ label, credits, tone, largest }: { label: string; credits: number; tone: string; largest: number }) {
  return (
    <li className="flex items-center gap-14">
      <span className="w-96 shrink-0 text-8 leading-14-4 text-ink-soft">{label}</span>
      <span className="flex min-w-0 flex-1 items-center gap-6">
        <span aria-hidden className={`h-26 rounded-badge ${tone}`} style={{ width: `${(credits / largest) * 88}%` }} />
        <span className="text-tile leading-14-4 font-650">{formatUnits(credits)}</span>
      </span>
    </li>
  );
}

export function CreditsNoDates({ credits }: { credits: CreditsPerTerm }) {
  const planned = credits.bars.filter((bar) => bar.planned > 0);
  const noTerm = credits.noTerm.done + credits.noTerm.planned;
  const prior = credits.prior.done + credits.prior.planned;
  const largest = Math.max(noTerm, prior, ...planned.map((bar) => bar.planned), 1);
  return (
    <div className="px-8 pt-22">
      <ul className="flex flex-col gap-30">
        {prior > 0 && <Row label="AP, IB and transfer" credits={prior} tone="bg-chart-none" largest={largest} />}
        {(noTerm > 0 || prior === 0) && <Row label="No term" credits={noTerm} tone="bg-chart-none" largest={largest} />}
        {planned.map((bar) => <Row key={bar.label} label={`${bar.label} (planned)`} credits={bar.planned} tone="bg-chart-planned" largest={largest} />)}
      </ul>
      <p className="pt-30 pb-16 text-8 leading-14-4 text-ink-muted">Average unavailable · add completed-course terms</p>
    </div>
  );
}
