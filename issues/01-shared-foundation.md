# 01: Shared foundation: engine types, sort presets, store undo and professor fixes

Ticket: 01
Wave: 1
Status: OPEN
Blocked By: none

**Track:** SHARED (lead: engine types, planner store, data helpers)

**What to build:** The planner knows the new engine contract and the new store behavior, so every later ticket builds on fixed shapes.
- Every sort names its own measure and sends the Best overall weights.
- Removing a course can be undone.
- Professor fixes, including the combined one with a start time, apply in one step.
- The unavailable-professor answer offers "Allow any professor" with a real count.
- There's a formatter for the "Course data updated" date.

No screen changes yet. The UI tickets wire these up. Runs in parallel with 02 and 04. It's tested against the engine fake, so it doesn't wait for the real engine.

- [ ] The engine types in the web app match `docs/engine-api.md` as 02 changes it (02 changes the doc first; agree on the shape below and keep it in sync):
  - optional `sort.primary` (`earlyMinutes` | `firstStart` | `lastEnd` | `days` | `freeMinutes` | null);
  - score fields `firstStart`, `lastEnd`, `averageStart`, `averageEnd` and `freeMinutes`;
  - optional `startsAfter` on the `clearAnyOf` fix.
- [ ] The sort presets table becomes `{ label, description, primary }` and the per-preset weights are removed:

  | ID | Label | Description | Primary |
  |---|---|---|---|
  | `bestOverall` | Best overall | A balance of start time, gaps and days | none |
  | `fewestEarly` | Fewest early classes | Fewer classes before 10 AM | `earlyMinutes` |
  | `latestStart` | Latest start | Classes start as late as possible each day | `firstStart` |
  | `earliestFinish` | Earliest finish | Classes end as early as possible each day | `lastEnd` |
  | `fewestDays` | Most days off | Fewer days on campus | `days` |
  | `fewestGaps` | Most compact | Less free time between classes | `freeMinutes` |

- [ ] Request building sends the Best overall weights (600 / 3, gap 1, day 60, 1440 / 0) for every preset, plus its `primary`. Best overall sends no `primary`. Its interface doesn't change, and no preset getters or other pass-through helpers are added.
- [ ] Preset IDs don't change. Stored drafts and saved plans keep their ID, and nothing is migrated.
- [ ] Store state gets `removedCourse` (shape below) and two actions, `undoRemoveCourse` and `dismissRemovedCourse`:
  - `removeCourse` saves the snapshot first: position, locks, professor, this course's alternatives, and whether it was selected.
  - A second remove replaces the snapshot.
  - Any other draft change clears it: add, preferences, sort, lock or unlock, professor, alternative, applying a fix, switching term, opening a plan.
  - Selecting a course or moving between schedules doesn't clear it.
  - Undo puts the course back at its position (clamped to the list length), restores everything, reselects it if it was selected, clears the snapshot, and solves once.
  - The snapshot isn't saved to the draft or with plans.
- [ ] `applyFix` for `clearAnyOf` clears the course's professor and, when `startsAfter` is present, sets the start time. It's one draft change and one solve.
- [ ] When a chosen professor has no sections this term, the store runs one more solve without that course's professor rule. If that gives schedules, the 0-result answer gets `clearAnyOf` for that course with that solve's count (one per course, in course order). The extra solve never replaces the answer on screen.
- [ ] The data helpers can format a term's `generatedAt` as "Oct 25, 2026" in the student's time zone.
- [ ] The frontend architecture doc lists the new store state and actions.
- [ ] Tests at the request-building and store seams:
  - each preset's weights and `primary`;
  - undo for position, locks, professor, alternatives and selection;
  - which changes clear the snapshot and which don't;
  - the combined fix applied in one solve;
  - the unavailable-professor fix and its count;
  - the date format.

Type shape (decision, not code to copy):

```ts
removedCourse: {
  code: string;
  index: number;
  locks: string[] | undefined;
  professor: string | null | undefined;
  alternatives: Record<string, string[]>;
  wasSelected: boolean;
} | null;
```
