"use client";

import type { KeyboardEvent } from "react";
import { DrawerFrame } from "@/components/ui/Drawer";
import { cx } from "@/components/ui/cx";
import { Button } from "@/components/ui/Button";
import { Plus } from "@phosphor-icons/react/ssr";
import type { DegreeSnapshot } from "@/lib/degree";
import { AddSeveralTab } from "./AddSeveralTab";
import { HistoryList } from "./HistoryList";
import { SearchTab } from "./SearchTab";
import { useDegreeUi, type HistoryTab } from "./degreeUi";
import type { DegreeView } from "./useDegreeView";

const TABS: { id: HistoryTab; label: string }[] = [
  { id: "history", label: "History" },
  { id: "search", label: "Search" },
  { id: "several", label: "Add several" },
];

const TITLES: Record<HistoryTab, string> = {
  history: "Course history",
  search: "Add to course history",
  several: "Paste courses from Workday",
};

export function HistoryTabs({ tab }: { tab: HistoryTab }) {
  const open = useDegreeUi((state) => state.open);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = TABS[(TABS.findIndex(({ id }) => id === tab) + step + TABS.length) % TABS.length];
    open({ kind: "history", tab: next.id });
  }

  return (
    <div role="tablist" aria-label="Course history" onKeyDown={onKeyDown} className="mt-14 flex gap-20 border-b border-line">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={tab === id}
          tabIndex={tab === id ? 0 : -1}
          onClick={() => open({ kind: "history", tab: id })}
          className={cx("-mb-px cursor-pointer border-b-2 pt-2 pb-8 text-8-5 leading-16", tab === id ? "border-accent font-600 text-accent" : "border-transparent text-ink-muted hover:text-ink")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function HistoryPanel({ tab, degree, view }: { tab: HistoryTab; degree: DegreeSnapshot; view: DegreeView | null }) {
  const close = useDegreeUi((state) => state.close);
  const open = useDegreeUi((state) => state.open);
  if (tab === "several") return <AddSeveralTab history={degree.history} tabs={<HistoryTabs tab={tab} />} />;
  return (
    <DrawerFrame
      title={TITLES[tab]}
      onClose={close}
      tabs={<HistoryTabs tab={tab} />}
      footer={
        tab === "history" ? (
          <Button fullWidth className="min-h-40" icon={<Plus aria-hidden />} onClick={() => open({ kind: "history", tab: "search" })}>Add a course</Button>
        ) : (
          <Button variant="secondary" size="md" className="min-h-40" onClick={close}>Cancel</Button>
        )
      }
    >
      {tab === "history" ? <HistoryList degree={degree} view={view} /> : <SearchTab history={degree.history} />}
    </DrawerFrame>
  );
}
