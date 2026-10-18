import { SearchMessage } from "./SearchMessage";

export function NoMatchMessage({ query, suggestion }: { query: string; suggestion: string | null }) {
  return (
    <SearchMessage title={`No course matches ‘${query}’.`}>
      <p className="text-10 leading-16-5 text-ink-muted">
        {suggestion ? `Try a code like ${suggestion} or a professor’s name.` : "Try a course code or a professor’s name."}
      </p>
    </SearchMessage>
  );
}
