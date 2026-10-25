# Spec: Sorting & ranking (must-haves)

Source: `issues/product-brief.md`, slices 1–3. The should-haves get their own spec later.

## Problem Statement

Adding 4–5 courses often gives dozens or hundreds of schedules that fit. Students don't want to flip through them. They want the one that fits their life on top. Today the Sort menu has one option, "Fewest early classes". Students care about different things: sleeping in, being done early, days off, no dead time between classes. One order isn't enough, and nothing on screen says why a schedule ranks where it does.

## Solution

The Sort menu gets six orders: Best overall (the new default), Fewest early classes, Latest start, Earliest finish, Most days off and Most compact. The engine does all the ranking. It keeps only the best schedules it finds, so re-sorting them in the browser would give the wrong top results. Each order is a set of weights the engine already understands, plus one new "late class time" weight for Earliest finish.

The chosen order is remembered in the draft and in saved plans. The schedule on screen shows 2–3 badges ("Starts 10 AM", "Fri off", "1 gap") that say what it's good at. The badge for the current order comes first.

## User Stories

1. As a student, I want a Sort menu with several orders, so that the schedule that fits my life shows up first.
2. As a new student, I want "Best overall" to be the default order, so that I get a sensible balance without choosing anything.
3. As a night owl, I want to sort by "Latest start", so that the top schedules start as late as possible on the days I have class.
4. As a night owl, I want "Latest start" to favor schedules that start late on more days, so that I sleep in most of the week, not just once.
5. As a student who dislikes mornings, I want "Fewest early classes" to keep working as it does today, so that my old drafts and plans don't change order.
6. As an athlete with practice at 4, I want to sort by "Earliest finish", so that schedules that end by 3 PM show up first.
7. As a student with a job, I want "Earliest finish" to still prefer fewer gaps and fewer days when two schedules end at the same time, so that the top result isn't worse in other ways.
8. As a commuter, I want to sort by "Most days off", so that schedules with fewer days on campus show up first.
9. As a commuter, I want to sort by "Most compact", so that schedules with the least time between classes show up first.
10. As a student, I want ties to fall back to a Best overall–like order, so that schedules that tie on what I chose are still ordered sensibly.
11. As a student, I want the same courses and order to always give the same ranking, so that the list doesn't shuffle when I come back.
12. As a student, I want picking an order to take me to its first schedule, so that I see its best result right away.
13. As a student, I want the order I chose to be remembered in my draft, so that it's still picked when I reload the page.
14. As a student, I want the order to be saved with a plan, so that opening the plan shows the schedules in the same order.
15. As a returning student with a plan saved before this change, I want it to keep its old order and weights, so that nothing changes without my knowing.
16. As a student, I want the Sort menu to look and work like the Saved plans and professor dropdowns, so that the app feels like one thing.
17. As a keyboard user, I want to open the Sort menu with Enter, Space or the arrow keys, so that I don't need a mouse.
18. As a keyboard user, I want to move through the orders with the arrow keys, Home and End, and by typing the first letters, so that I reach the one I want quickly.
19. As a keyboard user, I want Enter or Space to pick an order and Escape to close without changing anything, so that I stay in control.
20. As a keyboard user, I want focus back on the Sort control after I pick or close, so that I don't lose my place.
21. As a keyboard user, I want a clear focus ring on the Sort control and a clear highlight on the option I'm on, so that I always know where I am.
22. As a mouse user, I want the option under my pointer highlighted, so that I know what a click will pick.
23. As a screen reader user, I want the Sort control to be named "Sort", say the current order, and say whether it's open, so that I know what I'm changing.
24. As a screen reader user, I want the picked order announced as selected in the list, so that I know which one is on.
25. As a tablet user at 834 px, I want the Sort control and its list to fit on screen without sideways scrolling, so that I can use it on an iPad.
26. As a tablet user, I want the Sort control easy to tap, so that I don't miss it.
27. As a student, I want the Sort menu hidden when only one schedule fits, so that I'm not offered a choice that changes nothing.
28. As a student, I want to see 2–3 badges for the schedule on screen, so that I can tell why it ranks where it does without studying the calendar.
29. As a student flipping through schedules, I want the badges to update for each one, so that I can compare them quickly.
30. As a student, I want the badge that matches my order to come first, so that I can check the order did what I asked.
31. As a night owl, I want a "Starts 10 AM" badge giving the earliest class start of the week, so that I know how early I'd ever have to be up.
32. As an athlete, I want a "Done by 3 PM" badge giving the latest class end of the week, so that I know if I'll make practice.
33. As a commuter, I want a "Fri off" or "Mon, Fri off" badge, or "3 days off" when there are more, so that I see my free weekdays at a glance.
34. As a student who hates dead time, I want a "No gaps", "1 gap" or "4 gaps" badge counting breaks of 30 minutes or more, so that short walks between classes don't count as gaps.
35. As a student, I want badges that say nothing useful (like days off when I'm in all five days) left out, so that every badge tells me something.
36. As a screen reader user, I want the badges read as a short list named for this schedule, so that I hear them with the schedule and not as noise.
37. As a tablet user, I want the badges to wrap onto the next line instead of being cut off, so that I can read all of them.
38. As a student looking at a saved plan, I want its order shown read-only with its current label, so that I know how that plan was ranked.

## Implementation Decisions

### Order of work and commits

- One branch, `feature/sorting`, with four commits in this order, and one PR to `main`:
  1. Engine: contract doc, engine code, engine tests, rebuilt WebAssembly.
  2. Store: engine types, sort presets, architecture doc.
  3. Sort menu.
  4. Badges.
- Engine work comes first and is committed separately from the UI.
- One session acts as the lead and does all four commits, so shared-file change requests aren't needed.

### Module design: few deep modules, no helper sprawl

The ranking and badge logic sits in four deep modules. Each has a small interface and its own tests. The guiding rules:

- **The engine is the only module that ranks.** There's no ranking, filtering or re-sorting module in TypeScript. The browser never reorders `schedules`.
- **No per-order code paths.** An order is data (a preset), never a branch in a function. Adding an order means adding a row, not a function.
- **Extend modules that already exist instead of adding new ones.** Every interface below already exists except one, and that one replaces an existing function in the same place.
- **The deletion test.** Any helper that would only pass values through, like a getter for one preset's weights, one formatter per badge, or a "sort service" wrapped around the store, isn't created. Its work goes inside one of the four modules below.

| Module | Interface | What it hides | New or existing |
|---|---|---|---|
| **Engine scoring** | The JSON request/response contract (`sort` in, `score` out) | Per-day counting of early, gap and late minutes; the weighted total; keeping the best N during the search; the stable order on ties | Existing, extended with one weight pair |
| **Sort presets** | A read-only table of preset ID → label and full weights, plus one check "is this a preset ID" | Every number in the weights; menu order; which preset is the default | Existing, grows from 3 to 6 rows |
| **Request building** | One function: a draft or plan in, an engine request out (or nothing when there are no courses) | Turning the preset into `sort` weights, plus everything it already does (locks, professors, limits) | Existing, unchanged interface |
| **Schedule badges** | One function: the shown schedule's meetings and the current preset ID in, an ordered list of at most 3 badge texts out | Working out the week's facts (earliest start, latest end, free weekdays, long breaks), skipping empty badges, putting the current order's badge first, the wording and time format | New. Replaces the score-chips function in the schedule copy module at the same seam |

Notes on the interfaces:

- **Schedule badges** takes plain meetings (day, start, end), the shape the schedule items already have. It doesn't take the engine response or term data, so it doesn't depend on either. Its result is plain strings, and the schedule summary just renders them. The week facts are internal, never exported, and tested only through the texts they produce.
- **Sort presets** has no "options for the menu" helper. The menu lists every preset in table order. The current helper, which filters to "orders a design shows", is deleted, since nothing filters anymore.
- **Request building** stays the only place where a preset becomes engine weights.

Shown as a type shape to pin the interfaces down (not code to copy):

```ts
type SortPresetId = "bestOverall" | "fewestEarly" | "latestStart" | "earliestFinish" | "fewestDays" | "fewestGaps";
// Sort presets: SORT_PRESETS: Record<SortPresetId, { label: string; weights: Required<SortWeights> }>
// Schedule badges: (meetings: readonly { day: Day; start: number; end: number }[], sort: SortPresetId) => string[]  // at most 3
```

### Engine contract (additive to version 1)

- Version 1 stays frozen. Nothing is renamed, removed or changes meaning, and the new fields are additive, like `preferences.anyOf` before them.
- New request fields:
  - `sort.lateCutoff` (0 to 1440, default `1440`): class time after this counts as late.
  - `sort.perLateMinute` (0 to 10000, default `0`): cost of each late minute.
- New response field: `score.lateMinutes`, class minutes after `lateCutoff`, added up over the days.
- The total becomes early × weight + gap × weight + days × weight + late × weight. With the defaults the late part is 0, so every request without these fields, including every saved plan, scores exactly as before.
- Late minutes are counted per day, the same way early minutes are: the minutes from the cutoff to that day's last class end.
- Out-of-range values give `badRequest`, with the field name in `detail`, just like the other weights.
- The engine checks every pattern unless it runs out of steps, and keeps the best N. So the top N is the true top N for any N, and N stays at the current limit (200).
- No new tie-breaker in the engine. Ties are already broken in a stable way by the picked sections.
- The contract doc changes first, then the engine code. The engine code follows its existing structure and formatting, with no added comments.
- The WebAssembly build is regenerated and committed in the same commit as the engine source, because CI rejects a mismatch.

### Sort presets

- Six presets, in menu order:

  | ID | Label | Early cutoff / per min | Gap / min | Per day | Late cutoff / per min |
  |---|---|---|---|---|---|
  | `bestOverall` (new, default) | Best overall | 10:00 AM / 3 | 1 | 60 | none / 0 |
  | `fewestEarly` | Fewest early classes | 10:00 AM / 10 | 1 | 20 | none / 0 |
  | `latestStart` (new) | Latest start | 12:00 PM / 10 | 1 | 20 | none / 0 |
  | `earliestFinish` (new) | Earliest finish | 10:00 AM / 1 | 1 | 20 | 3:00 PM / 10 |
  | `fewestDays` | Most days off | 10:00 AM / 1 | 1 | 300 | none / 0 |
  | `fewestGaps` | Most compact | 10:00 AM / 1 | 5 | 20 | none / 0 |

- Best overall uses exactly the engine's own default weights. It's a fixed formula until the weighted-sliders slice.
- Latest start reuses the early term with a later cutoff. It needs no engine field of its own.
- Earliest finish uses a fixed 3:00 PM cutoff with no time picker. A student who must be done earlier can add a blocked time.
- The existing three IDs keep their weights. Only two labels change: "Fewest days on campus" becomes "Most days off" and "Fewest gaps" becomes "Most compact".
- Best overall is the default for new drafts only. Drafts and saved plans that already store a preset keep it, and nothing is migrated.
- Tie-break rule: every preset except Best overall has every term above 0, and its main term weighs more than it does in Best overall.
- Remembering the order needs no new work. The draft and saved plans already store the preset ID, and the new IDs pass the existing preset-ID check.
- Picking an order re-solves, and the switcher goes back to schedule 1. The store already does this, since a sort change doesn't ask to keep the shown schedule.
- The weights are a starting point. After the engine commit, each preset is run on a few real B-Term 2026 course sets to check that its top schedule matches its label. The numbers may be tuned before the store commit.

### Sort menu: look

- The brief stands in for the design of this feature. The labels are its words, exactly.
- **Closed control.** It keeps the design in `div.app-6`:
  - Surface fill, row radius, minimum width 146, padding 7.5 / 9, gap 6.
  - "Sort" in muted ink, then the current label in ink, both at the 9 px size.
  - A 10 px caret-down.
  - It stays right-aligned at the end of the Preferences row.
- **Open list.** It uses the shared listbox primitive the professor picker uses, so it looks like the professor list and the Saved plans menu:
  - Surface fill, the listbox border and shadow tokens, 5 px inner padding, 11 px corners.
  - Each option is at least 49 high, with the label in ink at 10 px / 700.
  - The picked option has the soft accent fill, accent text and a 13 px check icon on the right.
  - The list is at least as wide as the closed control and wide enough for the longest label without cutting it off.
- **The listbox primitive gets one new prop:** a trigger variant, `"field"` (today's look, the default) or `"menu"` (the closed Sort control above). It uses the same variant names as the shared select. The list itself is the same in both variants. The professor picker doesn't change.
- **Colors and type** come only from theme tokens and CSS variables: surface, surface-selected, accent, accent-soft, ink, ink-muted, the listbox border, the listbox shadow and focus. There are no hex values and no new color tokens. The font is DM Sans, from the app layout.
- The icons are the Phosphor caret-down and check icons already used by the other dropdowns, hidden from screen readers.
- The read-only view of a saved plan keeps its "Sort" chip with the preset's current label.

### Sort menu: keyboard, focus, hover and pressed

This is the behavior the shared listbox already has. The menu variant must keep all of it, and tests pin it down.

- **Tab order:** the Sort control is the last stop in the Preferences row, matching the visual order. Tab moves past it without opening it.
- **On the closed control:**
  - Enter, Space, ArrowDown and ArrowUp open the list, with the current order highlighted.
  - Typing letters opens the list and jumps to the first label starting with them ("L" → Latest start, "M" → Most days off, "MC" → Most compact).
- **In the open list:**
  - ArrowDown and ArrowUp move one option and stop at the ends; they don't wrap.
  - Home and End jump to the first and last option.
  - Typing letters works as type-ahead, and pressing the same letter again cycles through the options that start with it.
  - Enter or Space picks the highlighted option and closes the list.
  - Escape closes it without changing anything.
  - Tab closes it and moves on.
  - A click outside closes it.
- **Focus** stays on the control the whole time. The highlighted option is announced with `aria-activedescendant`. After picking, closing with Escape, or clicking an option, focus is on the control.
- **Focus look:**
  - The menu-style control uses the button focus ring: a 2 px outline in the focus color, 2 px from the control, shown only for keyboard focus (`focus-visible`). This is the same as the shared select's menu style today.
  - Field-style listboxes keep the field focus look: the choice-line border plus the field-focus halo.
  - The focus ring is never removed.
- **Highlight in the list:**
  - The option you're on uses surface-selected.
  - The picked option keeps its soft accent fill even when highlighted.
- **Hover:**
  - Moving the pointer over an option highlights it, the same way the arrow keys do. There is one highlight, never two.
  - The closed control gets no hover fill, as in the design. The pointer changes to a hand.
  - Nothing depends on hover alone; everything also works with touch and the keyboard.
- **Pressed:** there is no separate pressed look, since Figma has none. Picking an option changes the selection at once.
- **Motion:** the caret turns 180° while the list is open, as in the Saved plans menu, with a short transform transition. The transition is turned off for people who ask for reduced motion. The list itself appears without animation.
- **Screen readers:**
  - The control is a combobox named "Sort". Its text is the current label, and it reports open or closed.
  - The list is a listbox named "Sort", and the picked option is reported as selected.

### Badges: look and behavior

- The badges describe the schedule on screen. They sit right after the summary text under the title, in the spot where the score chips are now, and they replace them.
- They keep the score chips' look: a pill in the surface fill with the pill radius and 7 / 1 padding, muted ink at 8.5 px / 570, and no wrapping inside a badge. That uses tokens only and adds no new primitive styles.
- The four kinds and their wording:
  - Start: the earliest class start of the week, e.g. "Starts 10 AM".
  - Finish: the latest class end of the week, e.g. "Done by 3 PM".
  - Days off: Mon–Fri days with no class. One day gives "Fri off", two give "Mon, Fri off", three or more give "3 days off".
  - Gaps: breaks of 30 minutes or more between classes on the same day, counted over the week. This gives "No gaps", "1 gap" or "4 gaps".
- Times use the app's existing time format.
- At most 3 badges are shown. The badge for the current order comes first:

  | Current order | First badge |
  |---|---|
  | Latest start | Start |
  | Fewest early classes | Start |
  | Earliest finish | Finish |
  | Most days off | Days off |
  | Most compact | Gaps |
  | Best overall | none; uses the fixed order |

- The rest follow in the order Days off, Start, Gaps, Finish.
- A badge that says nothing is left out, for example Days off when there's class every weekday.
- Classes with no set time don't count toward any badge.
- Badges are hidden while solving, when nothing fits, and for saved plans, the same as the chips today.
- **Accessibility:**
  - Badges are a list named "This schedule", as the chips are today.
  - They aren't focusable and aren't a live region. The switcher already announces the schedule change, so the badges don't repeat it.
  - The text meets the existing muted-ink-on-surface contrast.

### Responsive rules

- **1440 px (main design):**
  - The Preferences row fits on one line, with Sort right-aligned at its end, as in `div.app-6`.
  - The Sort list opens below the control, right-aligned so it stays inside the window.
  - The badges sit on the same line as "3 courses · 24 schedules fit".
- **834 px (tablet):**
  - There's no tablet frame for these parts, so the layout follows the existing tablet behavior, where the details panel moves under the calendar below the wide breakpoint.
  - The Preferences row wraps. Sort stays the last item, right-aligned, and drops to its own line when there's no room. It's never squeezed below its 146 minimum width.
  - The Sort list uses the shared floating-position rules, so it flips above the control when there's no room below and shifts left to stay 8 px inside the window. It scrolls inside itself if the window is short.
  - The summary line wraps. The badges move to the next line as whole pills, 4 px apart vertically and 8 px horizontally, and are never cut off.
  - Touch:
    - Options are at least 49 high, so they're easy to tap.
    - The closed Sort control keeps its designed size, but its tap area is at least 44 high, made with an invisible extended hit area so the layout doesn't change.
- **Either size:**
  - No sideways page scrolling.
  - No text below the design's sizes.
  - Nothing overlaps the switcher or Plan actions.
- **Phone layout** comes later and isn't covered here.

### Modules and shared files to change

Feature folders are owned by feature agents and shared files by the lead (`AGENTS.md`, `docs/frontend-architecture.md`). This work is done as the lead, and editing the engine is allowed for this feature only.

| Area | Owner | Change |
|---|---|---|
| Engine API doc | lead | New `sort` fields and `score.lateMinutes`, with an "additive in version 1" note |
| Engine (scoring, JSON input/output, tests) | engine, allowed for this feature | Late term; same structure, no comments |
| Built WebAssembly engine | generated | Rebuilt from source, never edited by hand |
| Engine types in the web app | lead, shared | New `sort` fields and `score.lateMinutes` |
| Planner store: sort presets, default draft | lead, shared | Six presets, Best overall as the default for new drafts |
| UI primitives: listbox | lead, shared | Trigger variant `"field"` / `"menu"`, pointer-hover highlight, at least 44 px tap area for the menu variant |
| Frontend architecture doc | lead | Sort options: all six shown, the brief is the source for their labels |
| Preferences: Sort control | prefs | Uses the listbox menu variant; the "designed orders" filter is deleted |
| Schedule: summary line and copy | schedule | The badges function replaces score chips; the summary passes the shown meetings and the current preset |

Not touched: data scripts, published term data, the app layout and page, global CSS tokens.

## Testing Decisions

- A good test checks behavior through a module's interface: a request and its response, a draft and the request it builds, meetings and the badges they get, a menu and what a key press does. Tests don't reach internal helpers, the week facts behind the badges, or how a score is put together. Changing the code inside a module shouldn't break its tests.
- Seams, highest first. Every one already exists except the badges function, which takes the score chips' place.
  - **Engine contract** (the JSON request/response call). Engine tests at the API and score levels:
    - With the defaults, scores and order are exactly as before. The existing golden answers must not change.
    - Late minutes are counted per day after the cutoff.
    - A heavy late weight ranks a schedule that ends earlier first.
    - Out-of-range `lateCutoff` or `perLateMinute` gives `badRequest`, with the field name in `detail`.
    - Prior art: the existing API, score and JSON input/output tests and the golden files.
  - **Request building** (draft in, request out):
    - Each preset sends its full weights.
    - New drafts default to Best overall.
    - A stored older preset ID is kept.
    - The tie-break rule holds for every preset.
    - Prior art: the existing request-building and draft tests.
  - **Schedule badges** (meetings and preset in, texts out):
    - Start, finish and days off are worked out correctly.
    - The 30-minute gap threshold applies.
    - The current order's badge comes first, and at most 3 are shown.
    - Empty badges are left out.
    - The result for an empty week is defined.
    - Prior art: the existing tests of the summary copy and the schedule items.
  - **Listbox primitive** (component tests through the user's actions):
    - Every key listed under keyboard behavior works, including type-ahead.
    - Escape and Tab close the list.
    - Focus comes back to the control.
    - Pointer hover moves the highlight.
    - The ARIA roles and names are right.
    - The menu variant shows "Sort" and the current label.
    - The field variant is unchanged.
    - Prior art: the existing listbox and select tests.
  - **Browser** (one Playwright spec against the production build):
    - Changing the order re-ranks the schedules, resets to schedule 1 and changes the first badge.
    - The order survives a reload and a save-and-open.
    - The whole flow works with the keyboard only.
    - No sideways scrolling at 834 px.
    - Screenshots at 1440 px and 834 px. The closed Sort control is compared to `div.app-6`; the open list and badges have no design PNG yet.
    - Prior art: the prefs, schedule and professor-listbox specs.
- The Preferences row and schedule summary components get no new tests of their own. They only wire the modules above together, so the browser spec covers them.
- Real-data check of the preset weights, after the engine commit, on B-Term 2026 course sets. This is a manual check, not a unit test.
- Definition of done:
  - `npm run lint`, `npm run test` and `npm run build` pass.
  - The engine tests pass.
  - The WebAssembly build is reproducible.
  - The ui-reviewer agent finds no blocking issues.

## Out of Scope

- Lunch break order and its configurable window.
- Least walking order and any table of building distances.
- "Closest to my plan" (fewest sections changed).
- Weighted Best overall with sliders.
- "Make this a rule" next to the Sort menu, and any copy about sort versus rule.
- A time picker for the Earliest finish cutoff.
- Any ranking, filtering or re-sorting in TypeScript.
- A second ranking key in the engine, or an engine `sort.mode`.
- Engine API version 2.
- Changing how many schedules the engine returns.
- New color tokens.
- Dark theme.
- A pressed state.
- A Figma frame for the open Sort list or the badges. They can be refined later from a frame.
- Phone layout.

## Further Notes

- The brief's open questions, answered:
  - N's size doesn't matter, because the engine checks every pattern and keeps the true top N.
  - Best overall is a fixed formula for now.
  - The data does include seat counts.
  - The building table waits for the Least walking slice.
- The badges replace the existing score chips rather than showing next to them. That way there's one row explaining the shown schedule, not two.
- The pointer-hover highlight and the bigger tap area are added to the shared listbox, so the professor picker gets them too. That's an intended, small improvement, covered by the listbox tests.
- Saved plans also store their last engine response. Opening an old plan shows that saved response until it's solved again, which is today's behavior.
