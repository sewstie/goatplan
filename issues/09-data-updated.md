# 09: "Course data updated" date

Ticket: 09
Wave: 3
Status: OPEN
Blocked By: 01, 10

**Track:** shell (lead) and plans

**What to build:** The student can see when the course data for the term they're looking at was last updated: "Course data updated Oct 25, 2026".

- [ ] The date comes from the selected term's `generatedAt` in the term list already loaded, with no new fetch. It's in a `<time>` element with the full timestamp.
- [ ] Muted ink at 9 px / 400, tokens only.
- [ ] Placement:
  - 834 px and up: the bottom of the sidebar, right above the support links;
  - phone: the bottom of the page;
  - `/plans`: shown for the selected plan's term.
- [ ] Nothing shows before the term list loads. No "data is old" warning.
- [ ] `docs/design/copy.md` lists the text.
- [ ] Browser spec: the text matches the term's date, and it changes when the term changes.
