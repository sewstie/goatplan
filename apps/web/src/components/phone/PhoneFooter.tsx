import type { ReactNode } from "react";
import { PageFooter } from "@/components/shell/PageFooter";

/** The bottom of a phone page, the same on every page. A page can add its own link above the rest. */
export function PhoneFooter({ termId, generatedAt, feedbackTopic, extra }: { termId?: string; generatedAt?: string; feedbackTopic?: string; extra?: ReactNode }) {
  return (
    <div className="mt-auto pt-20">
      <PageFooter termId={termId} generatedAt={generatedAt} feedbackTopic={feedbackTopic} extra={extra} />
    </div>
  );
}
