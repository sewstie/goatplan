import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeCatalog } from "../update-catalog.mjs";

test("the daily catalog keeps old courses and observed term letters when published data expires", () => {
  const prior = [{ code: "CS 1005", title: "An older course", credits: 3, level: "Undergraduate", offeredThisYear: false, termLetters: ["A"] }];
  const seed = [{ code: "AB 2533", title: "Intermediate Arabic III", credits: 3, level: "Undergraduate" }];
  const terms = [{ term: { id: "2027-C", start: "2027-01-13" }, courses: [{ code: "CS 2102", title: "Object-Oriented Design Concepts", credits: 3, level: "Undergraduate" }] }];
  const first = mergeCatalog(prior, seed, terms);
  const later = mergeCatalog(first, seed, []);
  assert.deepEqual(later, first);
  assert.deepEqual(later.find((course) => course.code === "CS 1005").termLetters, ["A"]);
  assert.equal(later.find((course) => course.code === "AB 2533").offeredThisYear, false);
  assert.equal(later.find((course) => course.code === "CS 2102").offeredThisYear, true);
});
