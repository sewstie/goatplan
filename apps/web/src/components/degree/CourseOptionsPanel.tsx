"use client";

import type { ReactNode } from "react";
import { ArrowsLeftRight, BookOpen, CaretRight, PushPin, PushPinSlash, Trash } from "@phosphor-icons/react/ssr";
import { DrawerFrame } from "@/components/ui/Drawer";
import { codesOf, crossListed, lineName, sectionNameOfLine } from "@/lib/degree";
import { removeCourse, unpin } from "./degreeActions";
import { useDegreeUi } from "./degreeUi";
import { SummaryCard } from "./SummaryCard";
import type { DegreeView } from "./useDegreeView";

function Row({ icon, onClick, chevron = false, children }: { icon: ReactNode; onClick(): void; chevron?: boolean; children: ReactNode }) {
  return (
    <li className="border-b border-card-line last:border-b-0">
      <button type="button" onClick={onClick} className="flex min-h-51 w-full cursor-pointer items-center gap-11 px-17 text-left text-9 leading-15 hover:bg-surface-selected [&_svg]:size-15">
        {icon}
        <span className="flex-1">{children}</span>
        {chevron && <CaretRight aria-hidden className="size-12!" />}
      </button>
    </li>
  );
}

export function CourseOptionsPanel({ code, view }: { code: string; view: DegreeView }) {
  const close = useDegreeUi((state) => state.close);
  const open = useDegreeUi((state) => state.open);
  const names = crossListed(code);
  const tile = view.sheet.sections.flatMap((section) => section.tiles).find((item) => item.course !== null && names.includes(item.course));
  const title = tile ? `${sectionNameOfLine(tile.line)} · line ${tile.line}` : "Not on a line";

  return (
    <DrawerFrame title="Course options" onClose={close}>
      <SummaryCard eyebrow={codesOf(code)} title={title}>
        {tile?.pinned && (
          <span className="mt-10 inline-flex items-center gap-5 rounded-badge bg-accent-soft px-8 py-4 text-caption leading-14-4 font-570 text-accent">
            <PushPin aria-hidden className="size-12 text-ink" />
            Pinned by you
          </span>
        )}
      </SummaryCard>
      <ul className="mt-8 rounded-card border border-card-line">
        <Row icon={<BookOpen aria-hidden />} onClick={() => open({ kind: "details", code })}>Edit course</Row>
        <Row icon={<ArrowsLeftRight aria-hidden />} chevron onClick={() => open({ kind: "move", code })}>Move to line…</Row>
        {tile?.pinned && <Row icon={<PushPinSlash aria-hidden />} onClick={() => unpin(code)}>Unpin</Row>}
        <Row icon={<Trash aria-hidden />} onClick={() => removeCourse(code)}>Remove course</Row>
      </ul>
      <p className="pt-9 text-8-5 leading-17 text-ink-muted">
        {tile?.pinned ? "Unpin returns this course to the automatic best fit. Your history record stays." : tile ? `Now on ${lineName(tile.line)}. Your history record stays when it moves.` : "Your history record stays when it moves."}
      </p>
    </DrawerFrame>
  );
}
