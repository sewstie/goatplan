"use client";

import { shareData } from "@/lib/share/url";

export function SkipToMain() {
  return (
    <a
      href="#main"
      onClick={(event) => {
        const encoded = shareData(window.location.hash);
        if (encoded === null) return;
        event.preventDefault();
        const url = new URL(window.location.href);
        url.hash = `main&p=${encoded}`;
        window.history.replaceState(null, "", url);
        document.getElementById("main")?.focus();
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:top-8 focus:left-8 focus:z-20 focus:rounded-control focus:bg-surface focus:px-11 focus:py-9 focus:text-11 focus:font-570 focus:text-accent focus:shadow-popover"
    >
      Skip to main content
    </a>
  );
}
