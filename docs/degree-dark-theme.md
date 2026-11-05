# My degree theme checks

Ticket 12 applies the global theme to My degree. The desktop top bar uses the
existing theme button. The phone's More actions menu uses the same Dark theme
switch as the planner. Both controls remain available on the confirmations
and allocation screens.

Dark tiles distinguish completed, planned, empty and review states. Pins and
manual checkboxes retain their outlines. Completed, planned and empty chart
segments have separate tokens. Planned segments contrast with empty tracks,
and completed segments contrast with planned segments, by at least 3:1.
The subtle empty track has explicit counts beside it in both sheet and list
views. Text and tile labels meet 4.5:1 on their actual dark surfaces.

Light token values stay unchanged. The new `chart-done` token has the same
Light value as the accent it replaces. Dark overrides only apply to screen
media, so printing uses the Light colors while retaining the browser choice.

The implementation followed red → green cycles at the approved browser and
token-contrast boundaries. The tests first caught the missing desktop and
phone controls, then the light tile surfaces. UI review caught the adjacent
planned and empty progress colors; a regression test covers that pair and
the completed/planned pair.

Production screenshots are in `apps/web/e2e/screenshots/degree-theme-*.png`.
They cover sheet and list views, charts and tables, term pickers, history,
details, checks and validation feedback in both themes at 1440 and 834 px.
Phone captures cover the sheet, history, details and confirmations at 375 px.
Chart captures show the card directly so the insights scroller cannot hide it.

## Validation

The combined checkout includes tickets 03, 10, 11 and 12.

- Lint and the production build passed.
- All 1,660 Vitest tests passed.
- All 73 selected production browser checks passed, including 11 degree
  theme checks and the existing degree, history, badge and global theme tests.
- The ui_reviewer found no remaining issues after reviewing the revised
  progress colors and screenshots at 1440, 834 and 375 px.

The existing tester flag still controls degree access. This ticket adds no
major picker or public major release.
