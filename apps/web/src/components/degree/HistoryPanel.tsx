"use client";

import { DrawerFrame } from "@/components/ui/Drawer";
import type { DegreeSnapshot } from "@/lib/degree";
import { HistoryList } from "./HistoryList";
import { SearchTab } from "./SearchTab";
import { useDegreeUi, type HistoryTab } from "./degreeUi";

export function HistoryPanel({ tab, degree }: { tab: HistoryTab; degree: DegreeSnapshot }) {
  const close = useDegreeUi((state) => state.close);
  if (tab === "search") return <SearchTab history={degree.history} />;
  return (
    <DrawerFrame title="Course history" onClose={close}>
      <HistoryList degree={degree} />
    </DrawerFrame>
  );
}
