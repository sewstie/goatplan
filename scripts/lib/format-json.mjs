// Writes the term files as JSON with one section and one option per line.
//
// That keeps the files small (no indentation inside a section) while a day's
// git diff still shows exactly the sections whose seats or times changed.

const line = (indent, value, last) => `${indent}${JSON.stringify(value)}${last ? "" : ","}`;

// { term, generatedAt, courses } → the text of <term id>.json
export function formatTermFile({ term, generatedAt, courses }) {
  const out = [
    "{",
    `  "term": ${JSON.stringify(term)},`,
    `  "generatedAt": ${JSON.stringify(generatedAt)},`,
    `  "courses": [`,
  ];

  courses.forEach(({ sections, options, ...fields }, i) => {
    out.push("    {");
    for (const [key, value] of Object.entries(fields)) {
      out.push(`      ${JSON.stringify(key)}: ${JSON.stringify(value)},`);
    }
    out.push(`      "sections": [`);
    sections.forEach((s, j) => out.push(line("        ", s, j === sections.length - 1)));
    out.push("      ],", `      "options": [`);
    options.forEach((o, j) => out.push(line("        ", o, j === options.length - 1)));
    out.push("      ]", i === courses.length - 1 ? "    }" : "    },");
  });

  out.push("  ]", "}");
  return `${out.join("\n")}\n`;
}

// { terms: [...] } → the text of index.json, one term per line.
export function formatIndexFile({ terms }) {
  const out = ["{", `  "terms": [`];
  terms.forEach((t, i) => out.push(line("    ", t, i === terms.length - 1)));
  out.push("  ]", "}");
  return `${out.join("\n")}\n`;
}
