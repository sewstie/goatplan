export function focusTutorialTarget(id: string) {
  const target = document.getElementById(id);
  const disabled = (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLButtonElement) && target.disabled;
  if (target && !disabled) {
    target.focus();
    target.scrollIntoView?.({ block: "nearest" });
  } else {
    document.getElementById("main")?.focus();
  }
}
