import { X } from "@phosphor-icons/react/ssr";
import type { HistoryCourse } from "@/lib/degree";

type SuggestionChoicesProps = {
  kept: readonly HistoryCourse[];
  excluded: readonly string[];
  confirmations: readonly string[];
  unkeep(code: string): void;
  restore(code: string): void;
  unconfirm(note: string): void;
  clear(): void;
};

function Removable({ label, name, onRemove }: { label: string; name: string; onRemove(): void }) {
  return (
    <li className="inline-flex max-w-full items-center gap-2 rounded-badge border border-line bg-surface py-1 pr-2 pl-7 text-8 leading-12 text-ink">
      <span className="truncate">{label}</span>
      <button type="button" aria-label={name} onClick={onRemove} className="flex size-24 shrink-0 cursor-pointer max-tablet:size-32 items-center justify-center rounded-badge text-ink-muted hover:bg-surface-selected hover:text-ink"><X aria-hidden className="size-9" /></button>
    </li>
  );
}

export function SuggestionChoices({ kept, excluded, confirmations, unkeep, restore, unconfirm, clear }: SuggestionChoicesProps) {
  if (!kept.length && !excluded.length && !confirmations.length) return null;
  return (
    <div className="flex flex-col gap-8 rounded-card border border-line px-12 py-10">
      <div className="flex items-center justify-between gap-8">
        <p className="text-8-5 leading-13 font-650">Your choices</p>
        <button type="button" onClick={clear} className="cursor-pointer text-8 leading-12 font-600 text-accent">Clear all</button>
      </div>
      {kept.length > 0 && <ul aria-label="Kept choices" className="flex flex-wrap gap-4">{kept.map((course) => <Removable key={course.code} label={`Kept ${course.code} · ${course.term}`} name={`Unkeep ${course.code}`} onRemove={() => unkeep(course.code)} />)}</ul>}
      {excluded.length > 0 && <ul aria-label="Skipped courses" className="flex flex-wrap gap-4">{excluded.map((code) => <Removable key={code} label={`Skipped ${code}`} name={`Bring back ${code}`} onRemove={() => restore(code)} />)}</ul>}
      {confirmations.length > 0 && <ul aria-label="Experience you confirmed" className="flex flex-wrap gap-4">{confirmations.map((note) => <Removable key={note} label={`Experience: ${note}`} name={`Remove experience: ${note}`} onRemove={() => unconfirm(note)} />)}</ul>}
      <p className="text-8 leading-12 text-ink-muted">Suggest again to plan around these.</p>
    </div>
  );
}
