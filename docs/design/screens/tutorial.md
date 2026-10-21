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

The progress line is “Your first plan · Step 1 of 3”, changing with the step.
The close button is labelled “Close tutorial”. Every step offers “Skip tutorial”.
Back is disabled on the first step. The forward button reads “Next” until the
last step, where it reads “Finish tutorial”.

| Step | Heading | Explanation | Target button |
| --- | --- | --- | --- |
| 1 | Choose your term | Use the Term selector in the sidebar to choose when you’re taking classes. Your choices become your real plan. | Choose a term |
| 2 | Add your courses | Search by course code in the sidebar and add a course. GoatPlan chooses sections and generates schedules automatically. One course is enough to continue. | Search courses |
| 3 | Browse your schedules | Use the arrows beside Schedule planner to compare schedules. Select a class to see its sections. You can finish this guide even if no schedule fits, then adjust your choices in the planner. | Browse schedules |

## Validation and dismissal

Next is disabled until the selected term has loaded successfully. Show
“Choose a term and wait for its courses to load.” during loading or a term error.
Keep the existing term error and recovery controls.

On the course step, Next is disabled without a loaded term and at least one
selected course. Show “Add at least one course to continue.” No full load is
required. Back never changes the draft. Finish is always available on step 3.

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
