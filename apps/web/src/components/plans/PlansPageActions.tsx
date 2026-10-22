import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { ButtonLink } from "@/components/ui/ButtonLink";

export function PlansPageActions() {
  return <ButtonLink href="/" variant="secondary" icon={<ArrowLeft aria-hidden />}>Back to planner</ButtonLink>;
}
