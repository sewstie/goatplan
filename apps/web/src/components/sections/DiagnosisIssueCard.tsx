import { Warning } from "@phosphor-icons/react/ssr";
import { Card } from "@/components/ui/Card";
import type { DiagnosisIssue } from "@/lib/diagnosis/diagnosisText";

export function DiagnosisIssueCard({ issue }: { issue: Pick<DiagnosisIssue, "title" | "detail"> }) {
  return (
    <Card variant="issue" className="flex flex-col gap-6 p-11">
      <Warning aria-hidden className="size-18 text-ink" />
      <h3 className="text-12 leading-18 font-700 text-ink">{issue.title}</h3>
      <p className="text-10 leading-17 text-issue-ink">{issue.detail}</p>
    </Card>
  );
}
