"use client";

import { LinkBreak } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { SharedPageCard } from "./SharedPageCard";

export function SharedLinkError({ onReturn }: { onReturn(): void }) {
  return (
    <SharedPageCard icon={<LinkBreak />} title="We couldn’t open this plan" onClose={onReturn}>
      <p className="max-w-480 pt-14 text-10 leading-20 text-ink-muted">
        The link may be incomplete or use a format GoatPlan can’t read. Ask for a fresh link, or return to your schedule.
      </p>
      <Button size="md" className="mt-20" onClick={onReturn}>Return to my planner</Button>
      <p className="pt-16 text-8-5 leading-16 text-ink-muted">Your draft hasn’t changed.</p>
    </SharedPageCard>
  );
}
