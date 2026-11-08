import type { MapLayout } from "./csLayout";

export const RBE_LAYOUT: MapLayout = {
  subject: "RBE",
  rows: [
    ["", "RBE 1001", "", ""],
    ["RBE 2001", "RBE 2020", "RBE 2002", ""],
    ["", "", "RBE 3001", "RBE 3100"],
    ["", "", "RBE 3002", ""],
    ["RBE 4322", "RBE 4815", "RBE 4540", "RBE 4601"],
    ["", "RBE 4701", "RBE 4744", ""],
  ],
  pairs: [],
  areas: {
    "RBE 1001": "robotics", "RBE 2001": "manipulation", "RBE 2020": "embedded",
    "RBE 2002": "perception", "RBE 3001": "manipulation", "RBE 3002": "robotics",
    "RBE 3100": "interaction", "RBE 4322": "manipulation", "RBE 4815": "manipulation",
    "RBE 4540": "perception", "RBE 4601": "interaction", "RBE 4701": "perception",
    "RBE 4744": "perception",
  },
};
