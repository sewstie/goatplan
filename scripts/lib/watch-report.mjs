// Sums up watch/log.jsonl. How to read it is in docs/data-format.md.

const CHANGES = ["seats-only", "structure", "both"];

export const parseLog = (text) =>
  text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));

function median(sorted) {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function gapStats(changes) {
  const gaps = changes
    .slice(1)
    .map((change, i) => (Date.parse(change.checkedAt) - Date.parse(changes[i].checkedAt)) / 60_000)
    .sort((a, b) => a - b);
  if (gaps.length === 0) return null;
  return { shortest: gaps[0], median: median(gaps), longest: gaps.at(-1) };
}

const newYorkHour = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "numeric",
  hourCycle: "h23",
});
const newYorkTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  dateStyle: "medium",
  timeStyle: "short",
});

export function summarize(entries) {
  const changes = entries
    .filter((entry) => CHANGES.includes(entry.change))
    .map(({ checkedAt, change }) => ({ checkedAt, change }));
  const byHour = Array(24).fill(0);
  for (const { checkedAt } of changes) byHour[Number(newYorkHour.format(new Date(checkedAt)))]++;
  return {
    checks: entries.length,
    errors: entries.filter((entry) => entry.status === "error").length,
    versions: new Set(entries.map((entry) => entry.bodyHash).filter(Boolean)).size,
    changes,
    sameData: entries.filter((entry) => entry.change === "unchanged").length,
    gaps: gapStats(changes),
    byHour,
    server: {
      notModified: entries.filter((entry) => entry.status === 304).length,
      sendsEtag: entries.some((entry) => entry.etag),
      sendsLastModified: entries.some((entry) => entry.lastModified),
    },
  };
}

const duration = (minutes) =>
  minutes < 60 ? `${minutes} min` : minutes < 2880 ? `${(minutes / 60).toFixed(1)} h` : `${(minutes / 1440).toFixed(1)} days`;
const yesNo = (value) => (value ? "yes" : "no");

export function formatReport(summary, entries) {
  const lines = [
    "## WPI source watch",
    "",
    `- Checks: ${summary.checks} (${summary.errors} failed)`,
    entries.length ? `- From ${newYorkTime.format(new Date(entries[0].checkedAt))} to ${newYorkTime.format(new Date(entries.at(-1).checkedAt))} (New York time)` : "- No checks yet",
    `- Distinct versions of the file: ${summary.versions}`,
    `- Changes in the data: ${summary.changes.length}`,
    `- New file but same data: ${summary.sameData}`,
    "",
    "### Server",
    "",
    `- Sends ETag: ${yesNo(summary.server.sendsEtag)}`,
    `- Sends Last-Modified: ${yesNo(summary.server.sendsLastModified)}`,
    `- 304 Not Modified answers: ${summary.server.notModified}`,
    "",
    "### Gaps between changes",
    "",
  ];
  if (summary.gaps) {
    const { shortest, median, longest } = summary.gaps;
    lines.push(`- Shortest: ${duration(shortest)}`, `- Median: ${duration(median)}`, `- Longest: ${duration(longest)}`);
  } else {
    lines.push("- Not enough changes yet");
  }

  lines.push("", "### Changes by hour (New York time)", "");
  if (summary.changes.length) {
    lines.push("| Hour | Changes |", "| ---: | ---: |");
    summary.byHour.forEach((count, hour) => {
      if (count) lines.push(`| ${String(hour).padStart(2, "0")}:00 | ${count} |`);
    });
  } else {
    lines.push("- None yet");
  }

  lines.push("", "### Every change", "");
  if (summary.changes.length) {
    lines.push("| When (New York time) | Kind |", "| --- | --- |");
    for (const { checkedAt, change } of summary.changes) {
      lines.push(`| ${newYorkTime.format(new Date(checkedAt))} | ${change} |`);
    }
  } else {
    lines.push("- None yet");
  }
  return `${lines.join("\n")}\n`;
}
