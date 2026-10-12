// Works out which sections of a course have to be taken together.
// The rules, with examples, are under "Options" in docs/data-format.md.

// Labs and discussions hang off a lecture, they aren't a course by themselves.
const ADD_ON_TYPES = new Set(["lab", "discussion"]);

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function groupBy(items, keyFn) {
  const groups = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

function combinations(groups) {
  return groups.reduce(
    (partial, group) => partial.flatMap((picked) => group.map((item) => [...picked, item])),
    [[]],
  );
}

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

  // A cluster: one section of each type, plus any unclustered labs or discussions it has none of.
  for (const members of clusters.values()) {
    const byType = groupBy(members, (s) => s.type);
    const missing = [...looseAddOns].filter(([type]) => !byType.has(type)).map(([, group]) => group);
    options.push(...combinations([...byType.values(), ...missing]));
  }

  // An unclustered lecture: by itself, or with the unclustered labs.
  for (const section of looseMain) {
    options.push(...combinations([[section], ...looseAddOns.values()]));
  }

  // A course that is only labs.
  if (clusters.size === 0 && looseMain.length === 0 && looseAddOns.size > 0) {
    options.push(...combinations([...looseAddOns.values()]));
  }

  return options
    .map((option) => option.map((s) => s.id).sort(compare))
    .sort((a, b) => compare(a.join("\n"), b.join("\n")));
}
