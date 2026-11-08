import { offerHint, type TermOffers } from "@/lib/degree/termOfferings";

export function offerHintNode(code: string | null | undefined, term: string, offers: TermOffers | undefined) {
  const hint = code ? offerHint(code, term, offers) : null;
  if (!hint) return undefined;
  return <span className={hint.offered ? "text-success-ink" : "text-warning-ink"}>{hint.text}</span>;
}
