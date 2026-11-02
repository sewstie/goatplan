import { clearShareData } from "./url";

/** Takes the link data out of the address, so a reload doesn't reopen the plan, and lets the planner look again. */
export function closeSharedView(showDraft: () => void) {
  const url = new URL(clearShareData(window.location.href));
  url.searchParams.delete("view");
  url.searchParams.delete("plan");
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
  showDraft();
}
