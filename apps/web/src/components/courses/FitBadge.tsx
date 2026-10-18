import { Badge } from "@/components/ui/Badge";
import { fitText, type CourseFit } from "./courseFit";

export function FitBadge({ fit }: { fit: CourseFit }) {
  return <Badge tone={fit.kind === "fits" ? "success" : "warning"}>{fitText(fit)}</Badge>;
}
