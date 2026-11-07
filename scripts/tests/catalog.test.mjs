import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeCatalog } from "../update-catalog.mjs";

const course = (code, title) => ({ code, title, credits: 3, level: "Undergraduate" });
const term = (id, ...courses) => ({ term: { id }, courses });

test("the daily catalog keeps old courses and observed term letters when published data expires", () => {
  const prior = [{ ...course("CS 1005", "An older course"), lastOffered: "2025-A", termLetters: ["A"] }];
  const seed = [course("AB 2533", "Intermediate Arabic III")];
  const first = mergeCatalog(prior, seed, [term("2027-C", course("CS 2102", "Object-Oriented Design Concepts"))]);
  const later = mergeCatalog(first, seed, []);
  assert.deepEqual(later, first);
  assert.deepEqual(later.find((item) => item.code === "CS 1005"), { ...course("CS 1005", "An older course"), lastOffered: "2025-A", termLetters: ["A"] });
  assert.equal(later.find((item) => item.code === "AB 2533").lastOffered, null);
  assert.equal(later.find((item) => item.code === "CS 2102").lastOffered, "2027-C");
});

test("a course remembers the latest term it was seen in, and its newest title", () => {
  const terms = [term("2027-C", course("MA 1022", "Calculus II")), term("2026-B", course("MA 1022", "Old title")), term("2027-E", course("MA 1022", "Calculus II"))];
  const merged = mergeCatalog([], [], terms);
  assert.deepEqual(merged, [{ ...course("MA 1022", "Calculus II"), lastOffered: "2027-E", termLetters: ["B", "C", "E"] }]);
  const olderData = mergeCatalog(merged, [], [term("2026-A", course("MA 1022", "Calculus 2"))]);
  assert.equal(olderData[0].lastOffered, "2027-E");
  assert.equal(olderData[0].title, "Calculus II");
  assert.deepEqual(mergeCatalog(merged, [], [term("2027-A", course("MA 1022", "Calculus 2"))])[0], { ...course("MA 1022", "Calculus 2"), lastOffered: "2027-A", termLetters: ["A", "B", "C", "E"] });
});

test("older saved catalogs without a last term still load and drop the yearly flag", () => {
  const [old] = mergeCatalog([{ ...course("CS 1005", "An older course"), offeredThisYear: true, termLetters: ["A"] }], [], []);
  assert.deepEqual(old, { ...course("CS 1005", "An older course"), lastOffered: null, termLetters: ["A"] });
});
