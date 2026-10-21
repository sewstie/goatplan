# Design reference

[GoatPlan in Figma](https://www.figma.com/design/wKCRpXUKVwygCL5vn7F05W/GoatPlan?node-id=0-1&p=f&t=oGsmlalhHmS6qorE-0)

## New plans

A new draft shows Any time in the Starts after control, no blocked times, and
Only open sections enabled. Any time uses `startsAfter: 0` and leaves early
classes eligible. The student can choose a start time, block time, or turn off
Only open sections through the existing controls. Results update automatically.

Use the layout, tokens, typography, and labels in `screens/div.app.png` and its
screen notes. Its 9:00 AM value shows a configured plan. It is not the default
for a new plan. Other reference screens with a 9:00 AM preference also show
configured plans.

Reloading a draft, opening a saved plan, saving, or saving as a new plan keeps
the current settings. A term without a stored draft uses the new defaults.

## Lecture professors

Keep the Professor label, select styling, and Rate My Professors link from
`screens/div.app-3.png`. Any professor is the default. List instructors from
lecture sections only, including co-teachers. Hide the filter when the course
has no lectures. Individual section choices stay available.

Selecting a professor keeps all lectures they teach. Labs and discussions can
have other instructors. The same rule applies to the section-choice sheet and
diagnosis previews. Clearing the choice keeps the current availability settings.
