/**
 * Where the arrow keys move in a list of `count` items: down and up stop at the ends, Home and End jump.
 * Returns -1 for "up from the first item" (back to the search box) and null for keys it doesn't handle.
 */
export function nextIndex(current: number, count: number, key: string): number | null {
  if (count === 0) return null;
  switch (key) {
    case "ArrowDown":
      return Math.min(count - 1, current + 1);
    case "ArrowUp":
      return current - 1;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}
