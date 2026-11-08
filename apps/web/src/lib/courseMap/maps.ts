import { sources, type MapSource } from "./courseMap";
import { CS_LAYOUT, type MapLayout } from "./csLayout";
import rbeBackground from "./rbe-background.json";
import { RBE_LAYOUT } from "./rbeLayout";

import meBackground from "./me-background.json";
import { ME_LAYOUT } from "./meLayout";
import eceBackground from "./ece-background.json";
import { ECE_LAYOUT } from "./eceLayout";
import dsBackground from "./ds-background.json";
import { DS_LAYOUT } from "./dsLayout";

interface MapDefinition {
  records: readonly MapSource[];
  layout: MapLayout;
  source: string;
  areaHelp: string;
  summarized: boolean;
}

const MAPS: Record<string, MapDefinition> = {
  "cs-2030": {
    records: sources,
    layout: CS_LAYOUT,
    source: "https://wpi.cleancatalog.net/computer-science",
    areaHelp: "Colors are the four areas the major needs one course from, plus Cybersecurity.",
    summarized: false,
  },
  "me-2030": {
    records: meBackground as MapSource[],
    layout: ME_LAYOUT,
    source: "https://wpi.cleancatalog.net/mechanical-and-materials-engineering",
    areaHelp: "Colors group courses by topic. They don’t represent separate degree requirements. Background from courses outside this map appears on each card.",
    summarized: true,
  },
  "ece-2030": {
    records: eceBackground as MapSource[],
    layout: ECE_LAYOUT,
    source: "https://wpi.cleancatalog.net/electrical-and-computer-engineering",
    areaHelp: "Colors group courses by topic. They don’t represent separate degree requirements. Background from courses outside this map appears on each card.",
    summarized: true,
  },
  "ds-2030": {
    records: dsBackground as MapSource[],
    layout: DS_LAYOUT,
    source: "https://wpi.cleancatalog.net/data-science",
    areaHelp: "Colors group courses by topic. They don’t represent separate degree requirements. Background from courses outside this map appears on each card.",
    summarized: true,
  },
  "rbe-2030": {
    records: rbeBackground as MapSource[],
    layout: RBE_LAYOUT,
    source: "https://wpi.cleancatalog.net/robotics-engineering",
    areaHelp: "Colors group courses by topic. They don’t represent separate degree requirements. Background from CS, ECE, ES, math and physics appears on each course.",
    summarized: true,
  },
};

export function getCourseMap(sheetId: string | null | undefined): MapDefinition | null {
  return sheetId ? MAPS[sheetId] ?? null : null;
}
