# Theme behavior

Light and Dark apply to the planner, saved plans, shared views, registration and
My degree. The default is Light. `app/layout.tsx` reads `goatplan:theme:v1` before
paint and sets `data-theme` on the document. `lib/theme.ts` subscribes to that
attribute, so mounted controls stay in sync. A storage failure does not prevent
the theme changing for the visit.

## Controls and tokens

Desktop/tablet uses the top bar's ThemeButton. The phone planner uses Dark theme
in More actions; My degree uses a ThemeButton directly in its phone top bar.
Saved-plan controls reuse the same theme state. Theme controls do not depend on
any historical degree invitation flag.

`app/globals.css` defines Light defaults in `@theme static` and Dark overrides
for screen media. Components use semantic tokens for surfaces, text, borders,
course colors, checks and charts. DM Sans is the app font. Degree states remain
distinct through labels/icons as well as color.

Dark chart segments distinguish completed, planned and empty values. Counts
remain available beside subtle tracks. `chart-done` has a Light value matching
the original accent. Token contrast tests cover text and relevant adjacent chart
states; a token test does not replace a full accessibility review.

## Print and data

Print uses Light colors without changing the saved screen preference. Theme
does not change history, sheet selection, saved schedules, shared payloads or
calendar downloads. Contrast and print rules belong in tokens/styles rather
than route-specific data logic.

## Verification

Browser specs cover both themes, controls, persistence and Light print output.
Degree coverage includes sheet/list views, charts, history, details, term
pickers and confirmations at 1440, 834 and 375 px. Current test commands are in
[development](development.md).

[The original theme-release record](dark-theme-release.md) preserves historical
implementation results. Its test counts and release-gate plans do not describe
the current checkout.
