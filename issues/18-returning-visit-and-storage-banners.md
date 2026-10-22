# 18: Returning visit and storage banners

**What to build:**
- **Returning visit:** a returning student whose plan is restored sees a success banner listing what was kept: start time, blocked-time names, lecture professor and locked sections. For example: "Plan restored · 9 AM start, Work, Ye Lu and lab CX02 are kept." The guide doesn't appear.
- **Storage failure:** when the browser can't store guide progress, an info banner says "Guide progress can’t be remembered in this browser. You may see the guide again next visit." The step open at that moment switches once to "Keep planning in this visit". Planning carries on normally.

Parent: [00-spec](00-spec.md), user stories 53, 61. Screens: `div.app-35`, `div.app-36`.

**Blocked by:** 17 (Five-step guide popover).

**Status:** ready-for-agent

## Needs from lead
- **Tokens:** add the success surface and success ink colours.
- **Banner:** `success` and `info` tones.
- **Store:** a restored-plan summary (what a restored draft or saved plan kept), for the banner text.

## Acceptance criteria
- [ ] **Banners:** both use `role="status"` with hidden icons, and match the shape and copy in the notes.
- [ ] **Success banner:** appears only when a plan is restored and lists only what was actually kept.
- [ ] **Storage wording:** replaces only the step open at the failure, once. The info banner stays for the rest of the visit.
- [ ] **Vitest:** the summary text for different combinations of kept choices; the storage failure path with a throwing storage; the banner and one-time wording.
- [ ] **Playwright at 1440 px:** states 36 and 37 compared with the PNGs. Flows: reload after finishing the guide, and run with storage blocked.
- [ ] **834 px:** not covered, an agreed exception.
- [ ] **Checks:** lint, test and build pass. ui-reviewer finds no blocking issues.
