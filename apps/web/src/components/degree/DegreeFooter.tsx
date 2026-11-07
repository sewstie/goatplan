"use client";

import { ArrowSquareOut, ShieldCheck } from "@phosphor-icons/react/ssr";
import { useDegree } from "@/lib/degree";
import { SHEETS } from "@/lib/degree/sheets";

export function DegreeFooter() {
  const degree = useDegree();
  const sheet = SHEETS.find((item) => item.id === degree?.selectedSheetId);
  return <footer className="degree-footer">
    <p><ShieldCheck aria-hidden />{sheet?.verification ? `Checked by a ${sheet.abbreviation} student on ${sheet.verification.date}` : `Not yet checked by a ${sheet?.abbreviation ?? "CS"} student`}{!sheet?.verification && <> · <a href="https://github.com/sewstie/goatplan/issues/new?title=Degree%20sheet%20feedback" target="_blank" rel="noreferrer">Tell us if something looks wrong</a></>}</p>
    {sheet && <a href={sheet.source} target="_blank" rel="noreferrer">{sheet.abbreviation} {sheet.classYear} sheet <ArrowSquareOut aria-hidden /><span className="sr-only"> (opens in a new tab)</span></a>}
  </footer>;
}
