import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");
const tokens = (source: string) => Object.fromEntries(
  [...source.matchAll(/--color-([\w-]+):\s*(#[\da-f]{6});/gi)].map((match) => [match[1], match[2]]),
);
const light = tokens(css.split("@theme static {")[1].split("--text-*: initial")[0]);
const dark = { ...light, ...tokens(css.match(/:root\[data-theme="dark"\]\s*\{([^}]+)\}/)![1]) };

function rgb(hex: string) {
  return hex.slice(1).match(/../g)!.map((channel) => parseInt(channel, 16) / 255);
}

function luminance(channels: number[]) {
  const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(palette: Record<string, string>, ink: string, surface: string, opacity = 1) {
  const background = rgb(palette[surface]);
  const foreground = rgb(palette[ink]).map((channel, index) => opacity * channel + (1 - opacity) * background[index]);
  const levels = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
  return (levels[1] + 0.05) / (levels[0] + 0.05);
}

test("drawing mode preserves course room-text contrast over the calendar", () => {
  const opacity = Number(css.match(/:root\[data-theme="dark"\]\s*\{([^}]+)\}/)![1].match(/--opacity-course-drawing:\s*([\d.]+)/)?.[1] ?? 0.7);
  for (const slot of [1, 2, 3, 4]) {
    const background = rgb(dark[`course-${slot}`]);
    const calendar = rgb(dark.surface);
    const ink = rgb(dark[slot === 1 ? "on-accent" : "ink"]);
    const fill = background.map((value, index) => value * opacity + calendar[index] * (1 - opacity));
    const text = ink.map((value, index) => (value * 0.85 + background[index] * 0.15) * opacity + calendar[index] * (1 - opacity));
    const levels = [luminance(fill), luminance(text)].sort((a, b) => a - b);
    expect((levels[1] + 0.05) / (levels[0] + 0.05), `drawing course ${slot}`).toBeGreaterThanOrEqual(4.5);
  }
});

test("the charcoal planner palette keeps text, courses and controls readable", () => {
  expect(luminance(rgb(dark.canvas))).toBeLessThan(0.025);
  for (const surface of ["canvas", "surface", "surface-subtle", "surface-selected", "surface-raised"]) {
    for (const ink of ["ink", "ink-muted", "ink-soft", "ink-secondary", "ink-faint", "accent"]) {
      expect(contrast(dark, ink, surface), `${ink} on ${surface}`).toBeGreaterThanOrEqual(4.5);
    }
    for (const ink of ["focus", "line-control", "line-strong", "toggle-off"]) {
      expect(contrast(dark, ink, surface), `${ink} on ${surface}`).toBeGreaterThanOrEqual(3);
    }
  }
  for (const palette of [light, dark]) {
    expect(contrast(palette, "on-accent", "accent")).toBeGreaterThanOrEqual(4.5);
    for (const surface of ["hatch-a", "hatch-b"]) {
      expect(contrast(palette, "ink-hatch", surface)).toBeGreaterThanOrEqual(4.5);
    }
    for (const slot of [1, 2, 3, 4]) {
      expect(contrast(palette, slot === 1 ? "on-accent" : "ink", `course-${slot}`, 0.85), `course ${slot} room text`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette, "ink", `course-${slot}-soft`)).toBeGreaterThanOrEqual(4.5);
    }
  }
  for (const slot of [2, 3, 4]) {
    expect(contrast(dark, `course-${slot}-line`, `course-${slot}`)).toBeGreaterThanOrEqual(3);
    expect(contrast(dark, `course-${slot}-line`, "surface")).toBeGreaterThanOrEqual(3);
  }
});

test("planner notices and status chips remain readable in Dark", () => {
  for (const [ink, surface] of [
    ["info-ink", "notice-info"], ["notice-warning-ink", "notice-warning"],
    ["ink-muted", "notice-neutral"], ["success", "success-soft"],
    ["success-ink", "success-soft"], ["success-ink", "success-surface"],
    ["warning", "warning-soft"], ["warning-ink", "warning-surface"],
    ["alert", "alert-soft"], ["issue-ink", "issue-surface"],
    ["unfit-ink", "unfit-surface"], ["clash-ink", "clash-surface"],
    ["accent", "accent-soft"], ["accent", "accent-line"],
  ]) {
    expect(contrast(dark, ink, surface), `${ink} on ${surface}`).toBeGreaterThanOrEqual(4.5);
  }
});

test("share-link fields and feedback stay readable in Dark", () => {
  for (const ink of ["ink", "ink-soft", "ink-muted"]) {
    expect(contrast(dark, ink, "card-field"), `${ink} on share-link field`).toBeGreaterThanOrEqual(4.5);
  }
  for (const surface of ["surface", "card-field"]) {
    expect(contrast(dark, "card-line", surface), `share-link boundary on ${surface}`).toBeGreaterThanOrEqual(3);
  }
  expect(contrast(dark, "on-dark", "toast-dark")).toBeGreaterThanOrEqual(4.5);
});

test("degree tiles, history fields and chart states remain readable in Dark", () => {
  for (const surface of ["tile-done", "tile-empty", "tile-check", "card-field", "filter-surface"]) {
    for (const ink of ["ink", "ink-muted", "ink-soft", "ink-faint", "accent"]) {
      expect(contrast(dark, ink, surface), `${ink} on ${surface}`).toBeGreaterThanOrEqual(4.5);
    }
  }
  expect(contrast(dark, "notice-warning-ink", "tile-check")).toBeGreaterThanOrEqual(4.5);
  for (const [mark, surface] of [
    ["tile-empty-line", "tile-empty"], ["tile-check-line", "tile-check"],
    ["tile-planned-line", "surface"], ["tile-tick-line", "surface"],
    ["accent", "tile-done"], ["accent", "tile-check"],
    ["chart-planned", "surface"], ["chart-none", "surface"],
    ["chart-grid", "surface"], ["chart-done", "surface"],
  ]) {
    expect(contrast(dark, mark, surface), `${mark} on ${surface}`).toBeGreaterThanOrEqual(3);
  }
});

test("completed, planned and empty degree progress are distinguishable in Dark", () => {
  expect(contrast(dark, "chart-planned", "track")).toBeGreaterThanOrEqual(3);
  expect(contrast(dark, "chart-done", "chart-planned")).toBeGreaterThanOrEqual(3);
});
