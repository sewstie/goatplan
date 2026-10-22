# 07: Course panel v2 order with lecture ratings

**What to build:** When a student opens a course in the details panel, they see the Prototype v2 layout:
- "Lecture professor" comes first: its label, the current choice and the hint saying it filters lectures only.
- "Sections in this schedule" follows. The lecture card shows each instructor with a star and "x.x / 5" plus the rating count, or "— / 5 · Rating unavailable" when the data has no rating. Then come the "Rate My Professors" link and Lock/Unlock.
- Labs and discussions show as compact cards. A course with both shows the "Compatible" badge.
- "Optional" shows next to the label only when the course has more than one lecture professor.
- The filter is hidden for a course without lectures.
- The panel is 284 px wide.

The professor choice keeps working through today's select. Ticket 09 replaces it with the custom listbox.

Parent: [00-spec](00-spec.md), user stories 1–3, 6, 7, 13–17. Screens: `div.app-3` (reference), `div.app-6`, `-8`, `-10`, `-11`, `-12`, `-15`, `-18`, `-19`, `-21`, `-23`, `-28`.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Needs from lead
- **Panel width:** the details panel width token goes to 284px. Update `tokens.md` and every affected 1440 planner screenshot baseline in the same commit.
- **Rating data:** an optional per-instructor rating in the term data types and the data format doc: `rating: { score, count } | null`, missing meaning unknown.

## Acceptance criteria
- [ ] **Order:** the panel follows the v2 order and spacing in `div.app-3.md`, with the exact copy. State 16 keeps "Your choices".
- [ ] **Small components, one per file:** lecture professor field, instructor rating, lecture card, compact section card, Compatible badge, sections-in-schedule list.
- [ ] **Ratings:** the rating row shows score and count when the data has them, and the fallback when the rating is missing or null. Co-teachers each get their own row.
- [ ] **Rate My Professors link:** opens in a new tab, and its accessible name includes the professor and "(opens in a new tab)". Decorative icons are hidden from assistive tech.
- [ ] **"Optional" and hiding:** "Optional" shows only with more than one lecture professor. The field is hidden without lectures.
- [ ] **Colours:** CSS variable tokens only, no hex values. One colour per course.
- [ ] **Vitest** (real planner store through the provider, fixture term data):
  - the panel order;
  - rating with data and without;
  - co-teacher rows;
  - the link's accessible name;
  - the "Optional" rule;
  - the field hidden without lectures;
  - "Compatible" only when a course has both a lab and a discussion.
- [ ] **Playwright at 1440 px:** screenshots of states 04, 07, 24 and 29, compared with the PNGs. Note that the DEMO block colours differ by design decision. Existing planner baselines are updated for the 284 px panel.
- [ ] **834 px:** not covered by this ticket, an agreed exception to AGENTS.md.
- [ ] **Checks:** lint, test and build pass. The ui-reviewer agent finds no blocking issues.
