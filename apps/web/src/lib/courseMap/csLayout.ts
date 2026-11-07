export type AreaId = "systems" | "theory" | "design" | "social" | "cyber";

export interface MapLayout {
  rows: string[][];
  pairs: [string, string][];
  areas: Record<string, AreaId>;
}

export const AREA_NAMES: Record<AreaId, string> = {
  systems: "Systems",
  theory: "Theory & languages",
  design: "Design",
  social: "Social implications",
  cyber: "Cybersecurity",
};

const _ = "";

export const CS_LAYOUT: MapLayout = {
  rows: [
    [_, _, _, "CS 1101", "CS 1102", _, _, _, _],
    [_, _, _, "CS 2102", "CS 2103", _, "CS 2022", _, _],
    ["CS 2011", "CS 2303", "CS 2301", _, _, _, "CS 2223", _, _],
    ["CS 3516", "CS 3013", "CS 3404", "CS 3733", "CS 3431", "CS 3041", "CS 3133", _, "CS 3043"],
    ["CS 4516", "CS 4401", "CS 4241", "CS 4233", "CS 4432", "CS 4342", "CS 4120", "CS 4123", "CS 4032"],
    ["CS 4513", "CS 4402", "CS 4403", "CS 4731", "CS 4433", "CS 4343", "CS 4341", "CS 4533", "CS 4033"],
    ["CS 4404", "CS 4405", "CS 4801", "CS 4732", "CS 4445", "CS 4344", "CS 4100", "CS 4536", "CS 4099"],
    ["CS 4518", "CS 4515", _, "CS 4300", "CS 4804", "CS 4345", _, _, _],
  ],
  pairs: [["CS 1101", "CS 1102"], ["CS 2102", "CS 2103"], ["CS 2303", "CS 2301"]],
  areas: {
    "CS 3013": "systems", "CS 4513": "systems", "CS 4515": "systems", "CS 4516": "systems",
    "CS 3133": "theory", "CS 4120": "theory", "CS 4123": "theory", "CS 4533": "theory", "CS 4536": "theory",
    "CS 3041": "design", "CS 3431": "design", "CS 3733": "design", "CS 4233": "design",
    "CS 3043": "social",
    "CS 3404": "cyber", "CS 4401": "cyber", "CS 4402": "cyber", "CS 4403": "cyber", "CS 4404": "cyber", "CS 4405": "cyber", "CS 4801": "cyber",
  },
};
