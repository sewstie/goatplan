# v1 launch check

Checked on November 1, 2026, on `ralph/main/19`, starting from `b2329fb`.
This report covers the merged v1 implementation and ticket 19's review captures.

The local engineering checks pass. Share links, calendar export and seat refresh
are implemented. My degree remains hidden by default. Its public release needs
the owner's Workday comparison and launch decision. No owner approval, real
calendar import, production analytics delivery or friend test is implied by the
automated results below.

## Checks

| Check | Result |
|---|---|
| `npm run lint` | Pass. |
| `npm run test` | Pass: 163 files, 1,699 tests, including Wasm audit integration. |
| `npm run build` | Pass: production build and TypeScript checks. |
| `npm run engine:test` | Pass: 155 GoogleTest cases. |
| `npm run data:test` | Pass: 131 tests. |
| `PORT=3019 npm run test:e2e` | Pass: 394 tests, including six launch capture journeys. Screenshot comparisons are enabled. |
| `npm run engine:wasm` | Pass with Emscripten 6.0.12. Rebuilt assets match the committed files byte for byte. |
| `npm run engine:wasm:test` | Pass: all 18 native/Wasm answers match. |
| `git diff --exit-code -- apps/web/public/engine` | Pass after rebuilding. No generated engine assets changed. |
| `ui-reviewer` | No blocking issues. Reviewed fresh screenshots, component source, keyboard/focus behavior and ARIA tests. |

The sandbox initially denied an Emscripten cache lock and macOS file watching
for the Playwright dev server. Both commands passed with approved permissions.
The first launch capture run incorrectly expected textarea focus on phones;
the test now checks the sheet heading, matching the intentional phone behavior.
There are no unresolved check failures.

The Wasm SHA-256 hashes are:

```text
goatplan.mjs   9129d9d166f6a34266a74208e08f831e81794d5acfe5bbd13a80342729e493f7
goatplan.wasm  434b2d9902caac5af711045a472db7994b6df83746d407882d88dbf439a6b7a1
```

## Screens and UI review

Screens were captured at 1440, 834 and 375 px.

The reviewer checked My degree's empty/history/progress/expanded-line/check
states, course editing, paste and review, import confirmation and errors, shared
view/save/errors, calendar download guidance, search badges/filter, background
hints and seat freshness. Existing tests cover keyboard interaction, focus
return, labels, draft safety and default-hidden behavior. Review used the
existing primitives, theme tokens and DM Sans; no missing design folder was
required. Owner screenshot approval is still pending.

One nonblocking improvement remains: My degree's Edit and Remove controls use
compact `xs` buttons with a 21 px minimum height. Larger phone hit areas would
make them easier to tap. The reviewer did not perform a full accessibility audit
or duplicate the automated browser interactions.

## My degree release gate

| Gate | Status and evidence |
|---|---|
| Hidden by default | Pass. No global flag was enabled. A clean browser has no degree navigation; `/degree` redirects to `/`. `/#enable-degree` opts in only that browser. Unit and browser tests cover this. |
| Owner history against Workday | Pending. No owner history or recorded comparison was supplied. Do not treat synthetic fixtures as a Workday match. |
| Hand-written mid-degree history | Pass in native engine, Wasm/EngineClient and browser progress tests. `data/fixtures/degree-history-mid.json` supplies all 45 expected lines, section totals and checks for 22 taken and 2 planned courses. |
| Hand-written complete-degree history | Pass through the same three layers. `data/fixtures/degree-history-complete.json` supplies all 45 expected lines, manual items, checks, free electives and Extra courses for 43 taken courses. |
| Uncertain results stay explicit | Pass in contract, component and browser tests. The cases below retain warnings and manual confirmation. |
| Public enable decision | Pending owner decision for the Nov 9 gate. Beta, Unofficial and Class of 2030 notices remain. |

The hand-written histories validate our interpretation of the tracking sheet.
They do not establish that every interpretation agrees with WPI or a real
later-year student. See the [degree rules report](cs-2030-report.md).

## Check this yourself cases

| Case | Built behavior and remaining confirmation |
|---|---|
| Humanities depth without confirmation | Shows Check this yourself. A valid depth grouping offers Are these related? Only explicit confirmation resolves it. |
| Humanities spread across groupings | Unclear depth or breadth keeps Check this yourself, including when there is no qualifying depth grouping yet. No thematic relationship is inferred. |
| All-language humanities | Breadth remains Check this yourself under the language exception. Ask an advisor. |
| More than one humanities AP/IB course | Shows Check this yourself and warns that only one can count. |
| Non-CS Social Implications | GOV/ID 2314, GOV 2315, IMGD 2000 and RBE 3100 can satisfy the social check while filling another eligible line or free electives. The check remains Check this yourself. Advising must confirm this reading. |
| Graduate equivalence | Each matched graduate course fills one advanced CS line. The 2-for-3 bonus is not applied and Check this yourself remains. The UI hides this check when no graduate courses are involved. Advising must confirm the rule. |
| Residency | The engine conservatively asks Check this yourself once any taken or planned course is present. Course codes do not establish the required eight units at WPI. |
| Courses from 0.75 to under 3 credits | Go to the free elective credit pool, with This may also count toward another requirement. Check with your advisor. WPE uses its separate slots. |
| Typed or unknown courses | Default to 3 credits, count by normalized code and display the unknown-course notice. The student must confirm equivalence and credits. |
| Inquiry Seminar ordering | Displays the rule to finish five HUA courses first; ordering is not enforced. |
| IQP, MQP and sports | Require explicit manual confirmations. They are not inferred from history. |
| Repeated or cross-listed courses | Count once, with surplus copies in Extra. The rules for repeated credit remain a question for Advising. |

The shared audit contract cases in `engine/tests/fixtures/audit.json` cover the
engine warning states. Degree progress/details tests verify the warning copy,
manual controls and separate counts for uncertain lines. Small-credit and
unknown-course tests cover the additional notices.

## Open owner tasks

| Task | What remains |
|---|---|
| Umami account and test event | Create/configure the account and production website ID. Confirm one real named event, URL hash exclusion, no course/history properties and retention for months. Local tests have no production credentials and cannot prove dashboard delivery. If custom events fail, use the specified Vercel page-view fallback and record that decision. |
| Calendar imports | Import a generated C and D term file into Google Calendar and Apple Calendar. Check Jan 13's Monday schedule, Jan 18, Feb 12 and Feb 25 (Academic Advising Day, no classes) exclusions, Mar 29 exclusion, Mar 30's Monday schedule, section dates and times across daylight saving. |
| Workday and paste box | Provide the owner's course history, compare every line/check with Workday Academic Progress, and try the paste box on the real Workday page. The synthetic paste journey passes but does not establish a real student can finish within three minutes. |
| Testers | Recruit 5–10 friends, including at least two on phones. Record confusion, bugs and the real time to enter courses. |
| Academic Advising email | Ask whether non-CS Social Implications may also fill another line, how the graduate 2-for-3 rule applies, and how repeated courses count. Record the answers before changing interpretations. |
| Posts | Write and send the Class of 2030 chat post on Nov 10. Prepare ISC and r/WPI posts before January add/drop. No messages were sent by this check. |
| Screenshots and degree launch | Approve the screenshots at all three widths and record the Nov 9 My degree go/no-go decision. |
| Watcher report | Read the report and record whether to retain live seat refresh or rely on daily updates, including the daily update timing if changed. |

Owner tasks are follow-ups, not blockers to completing this ticket's engineering
work. They still matter to the owner's launch decision.

## Watcher disposition

No recorded owner report decision was found in the supplied spec or repository
docs. `.github/workflows/watch-source.yml`, `scripts/watch-source.mjs`,
`scripts/watch-report.mjs`, their helpers, tests and fixtures are retained.
The seat route remains. No watcher or daily schedule changes were made.

## Reproduce

Run the commands in the checks table from the repository root. Pick an unused
`PORT`; Playwright starts production at `PORT + 1000`. To regenerate only the
additional launch screen captures, run:

```bash
PORT=3019 npm run test:e2e -- --project=production launch-review.spec.ts
```

The full suite also captures calendar, share, badge, hint and freshness screens.
Review images before updating the committed copies. Do not use snapshot updates
to conceal a failed comparison.
