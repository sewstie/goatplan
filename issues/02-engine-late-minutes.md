# 02: Engine: late class time in the score

**Track:** ENGINE (editing the engine is allowed for this feature only)

**What to build:** A request can tell the engine that class time after a cutoff is costly. Schedules that finish earlier then rank first, and the response says how many late minutes each schedule has. Requests without the new fields, including every saved plan, score and rank exactly as they do today.

**Blocked by:** None (can start immediately). Every UI ticket waits for this one.

**Status:** DONE

- [ ] The engine API doc changes first:
  - `sort.lateCutoff` (0 to 1440, default 1440) and `sort.perLateMinute` (0 to 10000, default 0) go in the request table;
  - `score.lateMinutes` goes in the response;
  - a note says these are additive version 1 fields, like `anyOf`.
- [ ] Late minutes are counted per day, the same way early minutes are: the minutes from the cutoff to that day's last class end. They're added to the total as late minutes × per-late-minute weight.
- [ ] Out-of-range values give `badRequest`, with the field name in `detail`, like the other weights.
- [ ] The engine code keeps its existing structure and formatting, with no added comments.
- [ ] Engine tests:
  - with the defaults, scores and order are exactly as before, and the existing golden answers don't change;
  - late minutes are counted correctly per day;
  - a heavy late weight ranks an earlier-ending schedule first;
  - out-of-range values are rejected.
- [ ] The WebAssembly build is regenerated through the usual engine build script and committed in the same commit as the engine source, and a fresh build gives identical bytes.
- [ ] One engine commit, separate from any UI work.
- [ ] Verified by hand on the dev engine page or the command-line tool: a request with `lateCutoff: 900, perLateMinute: 10` ranks schedules that end by 3 PM first.
