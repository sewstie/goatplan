export const COURSE_DETAILS_ID = "course-details";

let opener: HTMLElement | null = null;

/** A keyboard pick takes focus into the details, so they aren't many Tabs away. Escape comes back. */
export function focusDetails() {
  const panel = document.getElementById(COURSE_DETAILS_ID);
  if (!panel || panel.checkVisibility?.() === false) return;
  opener = document.activeElement as HTMLElement | null;
  panel.focus();
}

export function returnFromDetails() {
  if (opener?.isConnected) opener.focus();
  opener = null;
}
