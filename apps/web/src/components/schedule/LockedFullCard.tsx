"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { sectionTypeName } from "@/lib/data";
import { usePlanner } from "@/lib/store";
import type { LockedFull } from "./lockedFull";

export function LockedFullCard({ locked }: { locked: LockedFull }) {
  const unlockSection = usePlanner((state) => state.unlockSection);
  const setPreferences = usePlanner((state) => state.setPreferences);
  const { course, section } = locked;
  const code = section.id.startsWith(`${course.code}-`) ? section.id.slice(course.code.length + 1) : section.id;
  const type = sectionTypeName(section.type);
  const open = Math.max(0, section.capacity - section.enrolled);
  const waiting = section.waitlist?.taken ?? 0;

  return (
    <div className="flex flex-1 items-center justify-center px-16 py-40">
      <div className="flex w-full max-w-430 flex-col">
        <Notice tone="warning" title={`${code} filled up since you saved`} large>
          The {type.toLowerCase()} is locked, and “Only open sections” is on. Both choices are still active.
        </Notice>
        <div className="mt-13 rounded-card border border-card-line px-19 py-19">
          <p className="text-9 leading-15 font-650">{course.code} · {type} {code}</p>
          <p className="pt-9 text-10 leading-17-5 text-ink-muted">{section.enrolled} enrolled / {section.capacity} capacity · {open} open</p>
          {waiting > 0 && <Badge tone="warning" className="mt-12 px-8! py-5!">Waitlist · {waiting} students</Badge>}
        </div>
        <div className="flex flex-wrap gap-8 pt-20">
          <Button size="md" className="min-h-38" onClick={() => unlockSection(course.code, section.id)}>Unlock {code}</Button>
          <Button variant="secondary" size="md" className="min-h-38" onClick={() => setPreferences({ onlyOpen: false })}>Show full sections</Button>
        </div>
        <p className="pt-14 text-8-5 leading-16 text-ink-muted">Register or join the waitlist in Workday.</p>
      </div>
    </div>
  );
}
