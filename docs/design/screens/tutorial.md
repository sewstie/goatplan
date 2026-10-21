# First plan guide

Use the existing planner from `div.app.png`. Place a full-width guide above the
shell, in normal document flow. Never cover or disable the planner controls.
Use DM Sans, surface and accent tokens, panel corners, and existing buttons.
The guide has 16 px padding and a 12 px gap to the planner. Its heading is 17 px;
body copy is 12 px. Keep the progress line and close button above the content.

At 1440 px the explanation and actions sit in one row. At 834 px actions wrap
below the explanation. All controls remain visible without horizontal scrolling.
The target button focuses and scrolls to the existing control. Each step focuses
its heading. Skip and Close focus the current target; Finish focuses the schedule
browser, including when it shows loading, no matches, or an error.

## Exact copy

The progress line is “Your first plan · Step 1 of 4”, changing with the step.
The close button is labelled “Close tutorial”. Every step offers “Skip tutorial”.
Back is disabled on the first step. The forward button reads “Next” until the
last step, where it reads “Finish tutorial”.

| Step | Heading | Explanation | Target button |
| --- | --- | --- | --- |
| 1 | Choose your term | Use the Term selector in the sidebar to choose when you’re taking classes. Your choices become your real plan. | Choose a term |
| 2 | Add your courses | Search by course code in the sidebar and add a course. GoatPlan chooses sections and generates schedules automatically. One course is enough to continue. | Search courses |
| 3 | Set availability if you want | New plans start at Any time, with no blocked time and Only open sections on. All changes are optional. | Find Starts after |
| 4 | Browse your schedules | Use the arrows beside Schedule planner to compare schedules. Select a class to see its sections. You can finish this guide even if no schedule fits, then adjust your choices in the planner. | Browse schedules |

The availability step shows a live summary under “Current availability”. Its
labels are “Starts after”, “Blocked time”, and “Sections”. Show “Any time” or the
actual start time, “None” or each blocked range with its days and optional name,
and “Only open sections” or “Open and full sections”. Use existing time and day
formatting. Never replace the student's settings with the defaults.

Below the summary, show: “To keep a break, use Block a time, choose your days,
and set 12 PM–1 PM. Turn off Only open sections to include full sections.”
The buttons “Find Block a time” and “Find Only open sections” focus the existing
controls, just as “Find Starts after” focuses the existing start-time selector.
These are navigation buttons, not duplicate preference controls.

The summary and extra target buttons stay in the explanation column at 1440 px.
At 834 px, all actions wrap below the copy. Next is always enabled on this step.
Show the actual preferences when returning with Back. Skip and Close return
focus to Starts after without changing preferences.

If results prove there are no matches, show this handoff note: “No schedule fits
your current choices. Your restrictions are still in place. Use the explanation
below and change a setting when you’re ready.” Keep Finish available and preserve
the existing diagnosis and recovery actions. Omit this note during loading,
errors, and incomplete searches.

## Validation and dismissal

Next is disabled until the selected term has loaded successfully. Show
“Choose a term and wait for its courses to load.” during loading or a term error.
Keep the existing term error and recovery controls.

On the course step, Next is disabled without a loaded term and at least one
selected course. Show “Add at least one course to continue.” No full load is
required. Back never changes the draft. Finish is always available on step 4.

Skip, Close, and Finish immediately remove the guide and retain the actual plan.
They remember dismissal or completion in this browser, separately from drafts.
Returning students with a restored course selection see the normal planner.
If persistence fails, show a status line above the shell: “This browser couldn’t
remember that you closed the guide. It may appear on your next visit.”

Reference PNGs use `tutorial-{term,courses,browse,dismissed,storage}-1440.png` and
`tutorial-{term,courses,browse,dismissed,storage}-834.png`. The courses reference
shows disabled advancement before a course is added. The dismissed reference
shows the retained course in the normal planner.

`tutorial-term-validation-1440.png` and `tutorial-term-validation-834.png` show
disabled advancement while a term is unavailable. A loading term uses the same
validation copy, alongside the existing loading placeholders.

`tutorial-availability-{fresh,configured,optional,no-match,completed}-1440.png`
and the corresponding `-834.png` references show the defaults, actual settings,
unchanged advancement, no-match handoff, and completion with retained choices.
