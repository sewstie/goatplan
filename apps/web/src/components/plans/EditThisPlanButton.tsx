"use client";

import { PencilSimple } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";

export function EditThisPlanButton({ onEdit }: { onEdit: () => void }) {
  return (
    <Button icon={<PencilSimple aria-hidden />} onClick={onEdit} className="min-w-112">
      Edit this plan
    </Button>
  );
}
