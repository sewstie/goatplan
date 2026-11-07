import type { ReactNode } from "react";

const ISSUES = "https://github.com/sewstie/goatplan/issues/new";

export function FeedbackLink({ topic, className, children = "Feedback" }: { topic: string; className?: string; children?: ReactNode }) {
  return (
    <a href={`${ISSUES}?title=${encodeURIComponent(topic)}`} target="_blank" rel="noreferrer" className={className}>
      {children}<span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
