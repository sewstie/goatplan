// Works out which sections of a course have to be taken together.
//
// WPI ties a lecture to its labs or discussions with a cluster ID, but only
// sometimes. In the real data there are three situations:
//
//   1. Everything is in a cluster (AE 2320: lecture CL01 + labs CX01-CX03).
//   2. Nothing is in a cluster, yet the course still has lectures and labs
//      (CH 1010: four lectures and twenty-one labs).
//   3. A mix (MA 1021: each lecture is clustered with its discussions, and the
//      labs are shared by every lecture and sit in no cluster at all).
//
// buildOptions handles all three and returns every valid combination.

// These types never make a course on their own when it also has a lecture:
// they are the add-on part of "lecture + lab" or "lecture + discussion".
const ADD_ON_TYPES = new Set(["lab", "discussion"]);

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// Groups items into a Map of key → items, in first-seen order.
export function groupBy(items, keyFn) {
  const groups = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

// [[a, b], [x, y]] → [[a, x], [a, y], [b, x], [b, y]]
function combinations(groups) {
  return groups.reduce(
    (partial, group) => partial.flatMap((picked) => group.map((item) => [...picked, item])),
    [[]],
  );
}

// Takes the sections of one course ({ id, type, cluster }) and returns its
// options: arrays of section ids, where taking the course means taking every
// section in exactly one option.
//
//   1 lecture + 3 labs in one cluster  →  3 options of [lecture, lab]
//   a section with no cluster          →  an option by itself
//
// Sections without a cluster ("loose" sections) follow two more rules:
//   - a loose lab or discussion is added to every lecture that has none of
//     that type in its own cluster, and to every loose lecture;
//   - if the course has nothing but loose labs or discussions, each one is an
//     option by itself.
// A loose lab in a course whose clusters all have their own labs ends up in no
// option: WPI hasn't said which lecture it belongs to.
export function buildOptions(sections) {
  const clusters = groupBy(
    sections.filter((s) => s.cluster),
    (s) => s.cluster,
  );
  const loose = sections.filter((s) => !s.cluster);
  const looseMain = loose.filter((s) => !ADD_ON_TYPES.has(s.type));
  const looseAddOns = groupBy(
    loose.filter((s) => ADD_ON_TYPES.has(s.type)),
    (s) => s.type,
  );

  const options = [];

  for (const members of clusters.values()) {
    const byType = groupBy(members, (s) => s.type);
    const missing = [...looseAddOns].filter(([type]) => !byType.has(type)).map(([, group]) => group);
    options.push(...combinations([...byType.values(), ...missing]));
  }

  for (const section of looseMain) {
    options.push(...combinations([[section], ...looseAddOns.values()]));
  }

  if (clusters.size === 0 && looseMain.length === 0 && looseAddOns.size > 0) {
    options.push(...combinations([...looseAddOns.values()]));
  }

  return options
    .map((option) => option.map((s) => s.id).sort(compare))
    .sort((a, b) => compare(a.join("\n"), b.join("\n")));
}
