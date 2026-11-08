import { Warning } from "@phosphor-icons/react/ssr";
import { Card } from "@/components/ui/Card";
import type { DiagnosisIssue } from "@/lib/diagnosis/diagnosisText";

export function DiagnosisIssueCard({ issue }: { issue: Pick<DiagnosisIssue, "title" | "detail"> }) {
  return (
    <Card variant="issue" className="flex gap-10 p-12">
      <span aria-hidden className="flex size-28 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
        <Warning weight="bold" className="size-15" />
      </span>
      <div className="flex min-w-0 flex-col gap-3 pt-4">
        <h3 className="text-10 leading-14-5 font-650 text-ink">{issue.title}</h3>
        <p className="text-9 leading-13 text-issue-ink">{issue.detail}</p>
      </div>
    </Card>
  );
}
