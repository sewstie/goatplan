import type { Point } from "./routing";

export function roundedPath(points: Point[], radius = 6) {
  const [first, ...rest] = points;
  let path = `M${first[0]},${first[1]}`;
  rest.forEach((point, index) => {
    const after = rest[index + 1];
    if (!after) {
      path += ` L${point[0]},${point[1]}`;
      return;
    }
    const before = index === 0 ? first : rest[index - 1];
    const inLength = Math.hypot(point[0] - before[0], point[1] - before[1]);
    const outLength = Math.hypot(after[0] - point[0], after[1] - point[1]);
    const r = Math.min(radius, inLength / 2, outLength / 2);
    const start = [point[0] - Math.sign(point[0] - before[0]) * r, point[1] - Math.sign(point[1] - before[1]) * r];
    const end = [point[0] + Math.sign(after[0] - point[0]) * r, point[1] + Math.sign(after[1] - point[1]) * r];
    path += ` L${start[0]},${start[1]} Q${point[0]},${point[1]} ${end[0]},${end[1]}`;
  });
  return path;
}
