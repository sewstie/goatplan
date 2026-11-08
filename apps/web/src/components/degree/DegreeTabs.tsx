"use client";

import { CalendarBlank, Graph, Sparkle, SquaresFour } from "@phosphor-icons/react/ssr";
import { cx } from "@/components/ui/cx";
import { COURSE_MAP_ON, SUGGESTIONS_ON } from "./degreeFeatures";

const TABS = [
  { id: "sheet", label: "Sheet", Icon: SquaresFour },
  { id: "plan", label: "Plan ahead", Icon: CalendarBlank },
  { id: "suggestions", label: "Suggestions", Icon: Sparkle },
  { id: "map", label: "Course map", Icon: Graph },
] as const;
export type DegreeTab = typeof TABS[number]["id"];

export function DegreeTabs({ value, onChange, mapAvailable = true }: { value: DegreeTab; onChange(value: DegreeTab): void; mapAvailable?: boolean }) {
  const tabs = TABS.filter((tab) => (tab.id !== "map" || (COURSE_MAP_ON && mapAvailable)) && (tab.id !== "suggestions" || SUGGESTIONS_ON));
  return <nav aria-label="Degree views" className="degree-tabs">
    {tabs.map(({ id, label, Icon }) => <button key={id} type="button" aria-current={value === id ? "page" : undefined} onClick={() => onChange(id)} onKeyDown={(event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const index = tabs.findIndex((tab) => tab.id === id);
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      onChange(tabs[next].id);
      (event.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus();
    }} className={cx("degree-tab", value === id && "degree-tab-active")}><Icon aria-hidden />{label}</button>)}
  </nav>;
}
