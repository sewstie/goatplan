import { expect, it } from "vitest";
import type { Section } from "@/lib/data/types";
import { termFile } from "@/lib/store/testing/fixtures";
import { hasProfessorChoice } from "./professorChoice";

const [lecture] = termFile("2027-C").courses[0].sections;
const taughtBy = (id: string, ...instructors: string[]): Section => ({ ...lecture, id, instructors });

it("offers a choice only when a professor teaches some lectures but not all", () => {
  expect(hasProfessorChoice({ sections: [taughtBy("a", "Ye Lu"), taughtBy("b", "Alex Rivera")] })).toBe(true);
  expect(hasProfessorChoice({ sections: [taughtBy("a", "Ye Lu"), taughtBy("b")] })).toBe(true);
});

it("offers no choice for one professor, one co-taught lecture or no lecture professor", () => {
  expect(hasProfessorChoice({ sections: [taughtBy("a", "Ye Lu"), taughtBy("b", " ye lu ")] })).toBe(false);
  expect(hasProfessorChoice({ sections: [taughtBy("a", "Ye Lu", "Alex Rivera")] })).toBe(false);
  expect(hasProfessorChoice({ sections: [taughtBy("a")] })).toBe(false);
  expect(hasProfessorChoice({ sections: [{ ...taughtBy("a", "Ye Lu"), type: "lab" }, { ...taughtBy("b", "Alex Rivera"), type: "lab" }] })).toBe(false);
});
