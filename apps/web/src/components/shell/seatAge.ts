const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

/** "Nov 8", for seat counts that are only as fresh as the daily file. */
export function seatDate(timestamp: string): string {
  return shortDate.format(new Date(timestamp));
}

/** "2 min ago", "2 h ago", "3 days ago". */
export function seatAge(timestamp: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - Date.parse(timestamp)) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} h ago`;
  const days = Math.floor(minutes / 1440);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}
