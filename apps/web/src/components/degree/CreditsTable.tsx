import { parseTerm, unitLabel, type CreditsPerTerm, type TermBar } from "@/lib/degree";

const amount = (credits: number) => (credits > 0 ? unitLabel(credits) : "—");

const rowName = (bar: TermBar) => {
  const term = bar.key ? parseTerm(bar.key) : null;
  return term ? `${term.letter} ${term.year}` : bar.label;
};

export function CreditsTable({ credits }: { credits: CreditsPerTerm }) {
  return (
    <table className="w-full text-left text-8 leading-14-4">
      <caption className="sr-only">Credits per term, in WPI units</caption>
      <thead className="text-caption text-ink-muted">
        <tr className="border-b border-line">
          <th scope="col" className="w-1/3 px-4 py-8 font-510">Term</th>
          <th scope="col" className="w-1/3 px-4 py-8 font-510">Done</th>
          <th scope="col" className="w-1/3 px-4 py-8 font-510">Planned</th>
        </tr>
      </thead>
      <tbody>
        {[...credits.bars, credits.noTerm].map((bar) => (
          <tr key={bar.label} className="border-b border-line">
            <th scope="row" className="px-4 py-11 font-400">{rowName(bar)}</th>
            <td className="px-4 py-11">{amount(bar.done)}</td>
            <td className="px-4 py-11">{amount(bar.planned)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
