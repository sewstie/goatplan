"use client";

import { ArrowSquareOut, ChatCircleText, FilePdf, SealCheck } from "@phosphor-icons/react/ssr";
import { PhoneFooter } from "@/components/phone/PhoneFooter";
import { FeedbackLink } from "@/components/shell/FeedbackLink";
import { usePhoneViewport } from "@/components/shell/usePhoneViewport";
import { useDegree } from "@/lib/degree";
import { SHEETS } from "@/lib/degree/sheets";
import { usePublishedTerms } from "./usePublishedTerms";

const LINK = "inline-flex items-center gap-6 rounded-badge text-ink-soft hover:text-accent [&_svg]:size-14 [&_svg]:shrink-0";

export function DegreeFooter() {
  const degree = useDegree();
  const phone = usePhoneViewport();
  const { terms } = usePublishedTerms();
  const sheet = SHEETS.find((item) => item.id === degree?.selectedSheetId);
  const topic = `${sheet ? `${sheet.abbreviation} ${sheet.classYear} sheet` : "My degree"} feedback`;
  if (phone) {
    return (
      <PhoneFooter
        generatedAt={terms.map((term) => term.generatedAt).sort().at(-1)}
        feedbackTopic={topic}
        extra={sheet && (
          <a href={sheet.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-5 rounded-badge underline hover:text-ink [&_svg]:size-12">
            <FilePdf aria-hidden />
            {sheet.abbreviation} {sheet.classYear} tracking sheet
            <span className="sr-only"> (PDF, opens in a new tab)</span>
          </a>
        )}
      />
    );
  }
  return (
    <footer className="degree-footer border-t border-line print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-20 gap-y-8 text-8 leading-16 text-ink-muted">
        <div className="flex flex-wrap items-center gap-x-16 gap-y-6">
          {sheet && (
            <a href={sheet.source} target="_blank" rel="noreferrer" className={LINK}>
              <FilePdf aria-hidden />
              {sheet.abbreviation} {sheet.classYear} tracking sheet
              <ArrowSquareOut aria-hidden className="text-ink-muted" />
              <span className="sr-only"> (PDF, opens in a new tab)</span>
            </a>
          )}
          {sheet?.verification && <span className="inline-flex items-center gap-6 [&_svg]:size-14"><SealCheck aria-hidden className="text-success" />Checked by a {sheet.abbreviation} student on {sheet.verification.date}</span>}
        </div>
        <FeedbackLink topic={topic} className={LINK}>
          <ChatCircleText aria-hidden />
          Send feedback
        </FeedbackLink>
      </div>
    </footer>
  );
}
