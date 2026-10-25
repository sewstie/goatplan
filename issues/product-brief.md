# GoatPlan: Product Brief (Sorting & Ranking)

## Problem

Adding 4–5 courses often produces dozens or hundreds of valid schedules. Students don't want to scroll through them. They want the one that fits **their** life at the top. Today the only sort option is "Fewest early classes". People care about different things (mornings, Fridays, gaps, walking, professors), so one sort option isn't enough.

## Who uses it

- **Freshman:** has fixed required courses and wants the "least painful" schedule.
- **Athlete or student with a job:** needs afternoons free, or classes packed into a few days.
- **Night owl:** won't take 8 AM classes, whatever else changes.
- **Commuter or off-campus student:** wants fewer days on campus and no long gaps.
- **Planner:** wants a safe backup if a section fills.

## User cases

1. **Sleep in:** "I sort by *Latest start* and the top schedule starts at 11 AM every day."
2. **Free Fridays:** "I sort by *Most days off* and see schedules with no Friday classes first. A badge says 'Fri off'."
3. **No dead time:** "I hate 2-hour gaps. *Most compact* puts back-to-back days at the top."
4. **Lunch:** "I want at least 45 min free between 11 and 2 every day. *Lunch break* ranks those first."
5. **Done early:** "I have practice at 4. *Earliest finish* shows schedules that end by 3."
6. **Less walking:** "I don't want to run from Fuller to Higgins in 10 minutes. *Least walking* ranks schedules with fewer building changes or nearby buildings."
7. **Mix:** "I care about mornings *and* Fridays. I pick *Best overall*, set 'mornings' to high and 'Fridays' to medium, and the ranking blends them."
8. **Why is this first?** "Each result shows 2–3 badges ('Starts 10 AM', 'Fri off', '1 gap') so I can see why it ranks where it does without opening it."
9. **Backup:** "Section BL04 is full. *Closest to my plan* ranks options by the fewest sections changed."

## Feature list

### Must have (next)
- [ ] **Sort menu** with: Best overall (default), Fewest early classes, Latest start, Earliest finish, Most days off, Most compact (least gap time).
- [ ] **Badges** on every result explaining its strengths (start time, days off, total gap hours).
- [ ] **Sorting happens in the engine, not the UI.** The engine keeps only the best N results, so re-sorting those N in the browser by a different key gives the wrong top results. Each sort option has to be a scoring mode sent in the request.
- [ ] **Remember the sort** in the draft and in saved plans.
- [ ] **Tie-breaker:** when scores tie, fall back to Best overall so the order stays stable.

### Should have
- [ ] **Lunch break** sort, with a configurable window (default 11:00–14:00, at least 45 min free).
- [ ] **Least walking** sort: fewer building changes between back-to-back classes. A distance table between buildings can come later.
- [ ] **Closest to my plan:** rank by the fewest sections changed from a saved or locked plan (the backup case).
- [ ] **Weighted "Best overall":** 3–4 sliders (mornings, Fridays/days off, gaps, finish time) that adjust the default score.
- [ ] **Sort vs. rule:** make the difference clear. A *rule* removes schedules (e.g. "no classes before 9"). A *sort* only reorders them. Next to the sort menu, offer "Make this a rule".

## Open questions
- Is "Best overall" a fixed formula or user-weighted from day one?
- How big should N be, so that each sort still finds its true best schedules?
- Which buildings count as "far apart" for Least walking? (Needs a small building table.)
- Does the published data include seat counts?

## Order of work (thin slices)
1. Engine: scoring modes plus a `sort` field in the request (additive API change), with tests.
2. UI: sort menu plus remembering the choice.
3. Badges on results.
4. Lunch break and Earliest finish.
5. Closest to my plan.
6. Weighted Best overall.