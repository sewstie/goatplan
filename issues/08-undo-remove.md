# 08: Undo remove

Ticket: 08
Wave: 3
Status: DONE
Blocked By: 01, 04, 10

**Track:** courses (search owns "Your courses"; the lead places the Toast in the app shell)

**What to build:** A student who removes the wrong course sees "Removed MA 1024 · Undo" for about 6 seconds. Undo brings the course back in the same place, with its locks, professor and picked lab or discussion, and its details if they were open. It waits for 10 so the shell isn't edited by two tickets at once.

- [ ] The app shell shows the Toast whenever `removedCourse` is set, with the text "Removed {code} · Undo". When it times out, it calls `dismissRemovedCourse`.
- [ ] Undo calls `undoRemoveCourse`. Focus then moves to the restored course's row. On phone, the "Your courses" list opens first if it's collapsed.
- [ ] The toast goes away as soon as anything else in the plan changes.
- [ ] Removing with the keyboard still moves focus to the neighbouring row, as today.
- [ ] Remove buttons are at least 44 × 44 px on phone.
- [ ] `docs/design/copy.md` lists the toast text.
- [ ] Browser spec at 1440 px and on the phone project:
  - remove, then Undo by click, tap and keyboard;
  - the locks, professor and lab choice are back;
  - the toast is gone after 6 s;
  - another change clears it.
