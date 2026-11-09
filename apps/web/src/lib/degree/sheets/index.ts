import type { TrackingSheet } from "./types";
import { expandSheetPatterns } from "./coursePatterns";
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
}, {
  id: "bbt-2030",
  major: "Biology and Biotechnology",
  abbreviation: "BBT",
  classYear: 2030,
  source: "https://www.wpi.edu/sites/default/files/2026-04/BBT-2030.pdf",
  catalogSource: "https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets",
  status: "beta",
  verification: null,
  officialLines: Array.from({ length: 45 }, (_, index) => index + 1),
}, {
  id: "bc-2030",
  major: "Biochemistry",
  abbreviation: "BC",
  classYear: 2030,
  source: "https://www.wpi.edu/sites/default/files/2026-06/BC-2030_fillable.pdf",
  catalogSource: "https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets",
  status: "beta",
  verification: null,
  officialLines: Array.from({ length: 45 }, (_, index) => index + 1),
}, {
  id: "ch-2030",
  major: "Chemistry",
  abbreviation: "CH",
  classYear: 2030,
  source: "https://www.wpi.edu/sites/default/files/2026-06/CH-2030_fillable.pdf",
  catalogSource: "https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets",
  status: "beta",
  verification: null,
  officialLines: Array.from({ length: 45 }, (_, index) => index + 1),
}, {
  id: "bcb-2030",
  major: "Bioinformatics and Computational Biology",
  abbreviation: "BCB",
  classYear: 2030,
  source: "https://www.wpi.edu/sites/default/files/2026-04/BCB-2030.pdf",
  catalogSource: "https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets",
  status: "beta",
  verification: null,
  officialLines: Array.from({ length: 45 }, (_, index) => index + 1),
}, {
  id: "eve-2030",
  major: "Environmental Engineering",
  abbreviation: "EVE",
  classYear: 2030,
  source: "https://www.wpi.edu/sites/default/files/2026-06/EVE-2030_fillable.pdf",
  catalogSource: "https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets",
  status: "beta",
  verification: null,
  officialLines: Array.from({ length: 45 }, (_, index) => index + 1),
}, {
  id: "baaai-2030",
  major: "Business Analytics and Applied AI",
  abbreviation: "BAAAI",
  classYear: 2030,
  source: "https://www.wpi.edu/sites/default/files/2026-05/BS-BA-AAI-Class-of-2030.pdf",
  catalogSource: "https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets",
  status: "beta",
  verification: null,
  officialLines: Array.from({ length: 45 }, (_, index) => index + 1),
}, {
  id: "mkt-2030",
  major: "Marketing Analytics",
  abbreviation: "MKT",
  classYear: 2030,
  source: "https://www.wpi.edu/sites/default/files/2026-05/BS-MA---Class-of-2030.pdf",
  catalogSource: "https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets",
  status: "beta",
  verification: null,
  officialLines: Array.from({ length: 45 }, (_, index) => index + 1),
}, {
  id: "pw-2030",
  major: "Professional Writing",
  abbreviation: "PW",
  classYear: 2030,
  source: "https://www.wpi.edu/sites/default/files/2026-04/PW-2030.pdf",
  catalogSource: "https://www.wpi.edu/student-experience/resources/academic-advising/program-tracking-sheets",
  status: "beta",
  verification: null,
  officialLines: Array.from({ length: 45 }, (_, index) => index + 1),
}];

const loaders: Record<string, () => Promise<TrackingSheet>> = {
  "bbt-2030": async () => (await import("./bbt-2030.json")).default as TrackingSheet,
  "bc-2030": async () => (await import("./bc-2030.json")).default as TrackingSheet,
  "ch-2030": async () => (await import("./ch-2030.json")).default as TrackingSheet,
  "bcb-2030": async () => (await import("./bcb-2030.json")).default as TrackingSheet,
  "eve-2030": async () => (await import("./eve-2030.json")).default as TrackingSheet,
  "baaai-2030": async () => (await import("./baaai-2030.json")).default as TrackingSheet,
  "mkt-2030": async () => (await import("./mkt-2030.json")).default as TrackingSheet,
  "pw-2030": async () => (await import("./pw-2030.json")).default as TrackingSheet,
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
    sheet = loader().then(expandSheetPatterns).catch((error: unknown) => {
      loaded.delete(id);
      throw error;
    });
    loaded.set(id, sheet);
  }
  return sheet;
}
