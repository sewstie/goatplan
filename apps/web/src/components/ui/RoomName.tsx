import { roomName } from "@/lib/data";

/** A room as its building and number ("Higgins Labs 230"), with the full name from the data as its title. */
export function RoomName({ location }: { location: string }) {
  const short = roomName(location);
  return <span title={short === location ? undefined : location}>{short}</span>;
}
