// One section and one option per line, so the daily git diff only shows what changed.

const line = (indent, value, last) => `${indent}${JSON.stringify(value)}${last ? "" : ","}`;

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

export function formatIndexFile({ terms }) {
  const out = ["{", `  "terms": [`];
  terms.forEach((t, i) => out.push(line("    ", t, i === terms.length - 1)));
  out.push("  ]", "}");
  return `${out.join("\n")}\n`;
}
