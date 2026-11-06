"use client";

import type { ReactNode } from "react";
import { BookOpen, DownloadSimple, ListChecks, PushPinSlash, Scales, UploadSimple } from "@phosphor-icons/react/ssr";
import { DrawerFrame } from "@/components/ui/Drawer";
import { downloadHistory, resetPins } from "./degreeActions";
import { useDegreeUi } from "./degreeUi";
import type { DegreeView } from "./useDegreeView";

function Item({ icon, onClick, children, disabled = false }: { icon: ReactNode; onClick(): void; children: ReactNode; disabled?: boolean }) {
  return (
    <li>
      <button type="button" disabled={disabled} onClick={onClick} className="flex min-h-44 w-full cursor-pointer items-center gap-11 rounded-row text-9 leading-15 hover:text-accent disabled:cursor-default disabled:opacity-50 [&_svg]:size-16 [&_svg]:text-ink">
        {icon}
        {children}
      </button>
    </li>
  );
}

export function SheetMenuPanel({ view, sheetReady = true }: { view: DegreeView | null; sheetReady?: boolean }) {
  const close = useDegreeUi((state) => state.close);
  const open = useDegreeUi((state) => state.open);
  const set = useDegreeUi((state) => state.set);
  const hasPins = (view?.pinnedLines.size ?? 0) > 0;

  return (
    <DrawerFrame title="Your sheet" onClose={close}>
      <div className="rounded-card border border-card-line px-17 py-16">
        <h3 className="pb-8 text-9 leading-15 font-650">Sheet options</h3>
        <ul>
          <Item disabled={!sheetReady} icon={<ListChecks aria-hidden />} onClick={() => open({ kind: "suggest" })}>Suggest courses</Item>
          <Item icon={<BookOpen aria-hidden />} onClick={() => open({ kind: "history", tab: "history" })}>Course history</Item>
          <Item icon={<DownloadSimple aria-hidden />} onClick={downloadHistory}>Export history &amp; pins</Item>
          <Item icon={<UploadSimple aria-hidden />} onClick={() => open({ kind: "transfer" })}>Import history</Item>
          <Item disabled={!sheetReady} icon={<Scales aria-hidden />} onClick={() => set({ panel: null, screen: "how" })}>How your courses count</Item>
          <div className="tablet:hidden">
            <Item disabled={!sheetReady} icon={<ListChecks aria-hidden />} onClick={() => set({ panel: null, screen: "confirmations" })}>Your confirmations</Item>
          </div>
        </ul>
        <div className="mt-10 border-t border-line pt-10">
          <button type="button" disabled={!hasPins} onClick={resetPins} className="flex min-h-34 w-full cursor-pointer items-center gap-11 rounded-row text-9 leading-15 text-accent hover:underline disabled:cursor-default disabled:text-ink-muted disabled:no-underline">
            <PushPinSlash aria-hidden className="size-16 text-ink" />
            Reset to best fit
          </button>
          <p className="pt-3 pl-27 text-8 leading-14-4 text-ink-muted">Clear manual assignments</p>
        </div>
      </div>
      <p className="pt-13 text-8-5 leading-17 text-ink-muted">Reset keeps course history and recalculates the sheet. The resulting toast offers Undo.</p>
    </DrawerFrame>
  );
}
