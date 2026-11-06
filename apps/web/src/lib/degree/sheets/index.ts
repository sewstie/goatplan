import type { TrackingSheet } from "./types";
export type { TrackingSheet } from "./types";

export interface SheetMetadata {
  id: string;
  major: string;
  abbreviation: string;
  classYear: number;
  source: string;
  catalogSource: string;
  status: "beta" | "checked";
  verification: { date: string; student: string } | null;
  officialLines: readonly number[];
}

export const DEFAULT_SHEET_ID = "cs-2030";

export const SHEETS: readonly SheetMetadata[] = [{
  id: DEFAULT_SHEET_ID,
  major: "Computer Science",
  abbreviation: "CS",
  classYear: 2030,
  source: "https://www.wpi.edu/sites/default/files/2026-06/CS-2030_fillable.pdf",
  catalogSource: "https://wpi.cleancatalog.net/computer-science/computer-science-major",
  status: "beta",
  verification: null,
  officialLines: Array.from({ length: 45 }, (_, index) => index + 1),
}, {
  id: "rbe-2030",
  major: "Robotics Engineering",
  abbreviation: "RBE",
  classYear: 2030,
  source: "https://www.wpi.edu/sites/default/files/2026-05/RBE-2030_fillable.pdf",
  catalogSource: "https://wpi.cleancatalog.net/robotics-engineering/robotics-engineering-major",
  status: "beta",
  verification: null,
  officialLines: Array.from({ length: 46 }, (_, index) => index + 1),
}, {
  id: "me-2030",
  major: "Mechanical Engineering",
  abbreviation: "ME",
  classYear: 2030,
  source: "https://www.wpi.edu/sites/default/files/2026-06/ME-2030_fillable.pdf",
  catalogSource: "https://wpi.cleancatalog.net/mechanical-and-materials-engineering/mechanical-engineering-major",
  status: "beta",
  verification: null,
  officialLines: Array.from({ length: 45 }, (_, index) => index + 1),
}, {
  id: "ece-2030",
  major: "Electrical and Computer Engineering",
  abbreviation: "ECE",
  classYear: 2030,
  source: "https://www.wpi.edu/sites/default/files/2026-07/ECE-2030_fillable.pdf",
  catalogSource: "https://wpi.cleancatalog.net/electrical-and-computer-engineering/electrical-and-computer-engineering-major",
  status: "beta",
  verification: null,
  officialLines: Array.from({ length: 45 }, (_, index) => index + 1),
}, {
  id: "ds-2030",
  major: "Data Science",
  abbreviation: "DS",
  classYear: 2030,
  source: "https://www.wpi.edu/sites/default/files/2026-06/DS-2030_fillable.pdf",
  catalogSource: "https://wpi.cleancatalog.net/data-science/data-science-major",
  status: "beta",
  verification: null,
  officialLines: Array.from({ length: 45 }, (_, index) => index + 1),
}];

export function isDegreeReleased(): boolean {
  return ["cs-2030", "rbe-2030", "me-2030", "ece-2030", "ds-2030"].every((id) => {
    const sheet = SHEETS.find((item) => item.id === id);
    return sheet?.status === "checked" && !!sheet.verification?.student.trim() && /^\d{4}-\d{2}-\d{2}$/.test(sheet.verification.date);
  });
}

const loaders: Record<string, () => Promise<TrackingSheet>> = {
  "ds-2030": async () => (await import("./ds-2030.json")).default as TrackingSheet,
  "ece-2030": async () => (await import("./ece-2030.json")).default as TrackingSheet,
  "me-2030": async () => (await import("./me-2030.json")).default as TrackingSheet,
  "rbe-2030": async () => (await import("./rbe-2030.json")).default as TrackingSheet,
  "cs-2030": async () => (await import("./cs-2030.json")).default as TrackingSheet,
};
const loaded = new Map<string, Promise<TrackingSheet>>();

export function loadSheet(id: string): Promise<TrackingSheet> {
  const loader = Object.hasOwn(loaders, id) ? loaders[id] : undefined;
  if (!loader) return Promise.reject(new Error(`Unknown tracking sheet: ${id}`));
  let sheet = loaded.get(id);
  if (!sheet) {
    sheet = loader().catch((error: unknown) => {
      loaded.delete(id);
      throw error;
    });
    loaded.set(id, sheet);
  }
  return sheet;
}
