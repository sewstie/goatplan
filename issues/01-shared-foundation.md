# 01: Shared foundation: sort presets and engine types

**Track:** SHARED (lead: planner store, engine types)

**What to build:** The planner knows all six sort orders. A new draft starts on Best overall. Every order sends its full set of weights to the engine, including the new late-minute pair. Older drafts and saved plans keep the order they had, with the same weights. No screen changes yet: the Sort control still shows only the orders it shows today.

**Blocked by:** None (can start immediately). Runs in parallel with 02; nothing here touches the engine or any UI.

**Status:** ready-for-agent

- [ ] The engine types in the web app carry the optional `sort.lateCutoff` and `sort.perLateMinute` request fields and the `score.lateMinutes` response field, matching the contract in 02.
- [ ] The sort presets table has six rows in this menu order, with these labels and weights:

  | ID | Label | Early cutoff / per min | Gap / min | Per day | Late cutoff / per min |
  |---|---|---|---|---|---|
  | `bestOverall` | Best overall | 600 / 3 | 1 | 60 | 1440 / 0 |
  | `fewestEarly` | Fewest early classes | 600 / 10 | 1 | 20 | 1440 / 0 |
  | `latestStart` | Latest start | 720 / 10 | 1 | 20 | 1440 / 0 |
  | `earliestFinish` | Earliest finish | 600 / 1 | 1 | 20 | 900 / 10 |
  | `fewestDays` | Most days off | 600 / 1 | 1 | 300 | 1440 / 0 |
  | `fewestGaps` | Most compact | 600 / 1 | 5 | 20 | 1440 / 0 |

- [ ] The three existing IDs keep their old weights. Only two labels change: "Fewest days on campus" → "Most days off", "Fewest gaps" → "Most compact".
- [ ] New drafts default to `bestOverall`. A stored draft or saved plan with an older preset ID keeps it, and nothing is migrated.
- [ ] The new IDs pass the existing preset-ID check, so they're remembered in the draft and in saved plans with no other change.
- [ ] Request building stays the only place where a preset becomes engine weights, and its interface doesn't change. No preset getters or other pass-through helpers are added.
- [ ] Tests at the request-building seam:
  - each preset sends its full weights;
  - new drafts use Best overall;
  - an older stored ID is kept;
  - the tie-break rule holds for every preset except Best overall: every term is above 0 and its main term weighs more than in Best overall.
- [ ] The frontend architecture doc says all six orders are shown, and that `issues/product-brief.md` is the source for their labels.
- [ ] `npm run lint`, `npm run test` and `npm run build` pass.
