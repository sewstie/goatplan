import { unitLabel, type CreditsPerTerm } from "@/lib/degree";

const amount = (credits: number) => (credits > 0 ? unitLabel(credits) : "—");

export function CreditsTable({ credits }: { credits: CreditsPerTerm }) {
  return (
    <table className="w-full text-left text-8 leading-14-4">
      <caption className="sr-only">Units per term</caption>
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
            <th scope="row" className="px-4 py-11 font-400">{bar.label}</th>
            <td className="px-4 py-11">{amount(bar.done)}</td>
            <td className="px-4 py-11">{amount(bar.planned)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
