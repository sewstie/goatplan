"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { PageDialog } from "@/components/ui/PageDialog";
import { lineName } from "@/lib/degree";
import { shortLine } from "./degreeActions";
import { useDegreeUi } from "./degreeUi";

export function RestoredPinDialog() {
  const restored = useDegreeUi((state) => state.restored);
  const set = useDegreeUi((state) => state.set);
  if (!restored) return null;
  const close = () => set({ restored: null });
  const { rejected, kept } = restored;
  const first = rejected[0];
  return (
    <PageDialog
      open
      wide
      onClose={close}
      title={rejected.length === 1 ? "Review a restored pin" : "Review restored pins"}
      breadcrumb="My degree / Course assignment"
      footer={<Button size="md" className="min-h-38" onClick={close}>Review sheet</Button>}
    >
      <Notice tone="warning" title={rejected.length === 1 ? "One pin couldn’t be restored" : `${rejected.length} pins couldn’t be restored`} className="mt-16">
        {first.code} is not allowed on {lineName(first.line)}. {rejected.length === 1 ? "That pin was" : "Those pins were"} ignored; the rest of your history loaded.
      </Notice>
      <ul className="pt-10">
        {rejected.map((pin) => (
          <li key={`${pin.code}-${pin.line}`} className="flex items-center justify-between gap-12 border-b border-line py-14">
            <div>
              <p className="text-8-5 leading-16 font-650">{pin.code}</p>
              <p className="pt-5 text-8 leading-14-4 text-ink-muted">This course still counts once in an eligible line.</p>
            </div>
            <Badge>Best fit</Badge>
          </li>
        ))}
        {kept.map((pin) => (
          <li key={`${pin.code}-${pin.line}`} className="flex items-center justify-between gap-12 border-b border-line py-14 last:border-b-0">
            <div>
              <p className="text-8-5 leading-16 font-650">{pin.code} → {shortLine(pin.line)}</p>
              <p className="pt-5 text-8 leading-14-4 text-ink-muted">Your other valid pin is unchanged.</p>
            </div>
            <Badge tone="accent">Pin kept</Badge>
          </li>
        ))}
      </ul>
      <p className="pt-14 text-8-5 leading-16 text-ink-muted">A rejected assignment does not invalidate otherwise valid course history.</p>
    </PageDialog>
  );
}
