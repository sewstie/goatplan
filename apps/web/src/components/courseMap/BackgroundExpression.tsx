import type { Background } from "@/lib/courseMap/courseMap";

export function BackgroundExpression({ value }: { value: Background }) {
  if ("course" in value) return <span className="font-600">{value.course}</span>;
  if ("note" in value) return <span>{value.note}</span>;
  const parts = "all" in value ? value.all : value.any;
  const join = "all" in value ? " AND " : " OR ";
  return <span>({parts.map((part, index) => <span key={index}>{index > 0 && <span className="font-700 text-accent">{join}</span>}<BackgroundExpression value={part} /></span>)})</span>;
}
