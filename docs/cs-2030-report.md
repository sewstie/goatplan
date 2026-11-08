# Class of 2030 CS Degree Rules — Report

Source: [CS-2030 tracking sheet (PDF)](https://www.wpi.edu/sites/default/files/2026-06/CS-2030_fillable.pdf)
Catalog: [2026-27 catalog, CS major](https://wpi.cleancatalog.net/computer-science/computer-science-major)
Rules file: `apps/web/src/lib/degree/sheets/cs-2030.json`
Test histories: `data/fixtures/degree-history-mid.json`, `data/fixtures/degree-history-complete.json`

## Catalog differences

These are the differences between the tracking sheet (PDF) and the 2026-27 online catalog.
The tracking sheet is authoritative for the Class of 2030.

| Item | Sheet (PDF) | Catalog | Decision |
|---|---|---|---|
| Social Implications courses | CS 3043, GOV/ID 2314, GOV 2315, IMGD 2000, RBE 3100 | Same as sheet **plus IMGD 2002** | Used the **sheet's list**. IMGD 2002 is not on the sheet and is omitted from the rules file. If it's added to a future sheet revision, the rules file should be updated. |
| Science line 41-43 disciplines | "BB, CH, GE, PH" on the printed lines | Full Note 4 list applies to all science lines; catalog enumerates eligible courses per discipline | Used the **sheet's interpretation**: lines 41-43 are restricted to BB/CH/GE/PH; lines 44-45 accept the full Note 4 set (AE, BB, BME, CE, CH, CHE, ECE, ES, GE, ME, PH, RBE) minus RBE 3100 and BME 1004. |
| Cross-listed courses listed | Only a few examples (CS 2022/MA 2201, CS 4032/MA 3257, CS 4033/MA 3457) mentioned in Note 2 | Full list of cross-listed pairs per discipline | Included all cross-listed pairs that could affect CS/Math/Science lines. |
| Only one of CS 1101/1102 | Not explicitly stated on sheet; Note 1a says "Only CS 1101, CS 1102 and computer science courses at the 2000-level or higher" | Catalog says "Only ONE of CS 1101 and CS 1102 may count" | Used catalog's explicit rule. Added as an only-one-of set. |
| Course enumeration | Not enumerated | Full course lists per discipline | The rules file uses subject+level filters, not enumerated lists. The catalog's enumeration was used to verify the filter logic. |

## Rule interpretations

These rules required interpretation because the sheet or catalog language was ambiguous or incomplete.

### 1. Area lines 22-25 vs. area checks

The sheet shows lines 22-25 labeled "Systems", "Theory & Languages", "Design", "Social Implications". These are CS 2000+ lines with area tags. The spec clarifies: "Lines 22–25 are the sheet's area lines. They match as ordinary CS 2000+ lines, and the four areas are checks." A course filling line 22 doesn't have to be a Systems course — the Systems requirement is a separate check that any matched CS course satisfies.

**Decision:** Lines 22-25 have the same `subjectMinLevel CS 2000` filter as lines 17-21. The area requirement is a check, not a line filter. The `areaTag` field is informational.

### 2. Non-CS Social Implications courses

The sheet says: "If GOV/ID 2314, GOV 2315, IMGD 2000, or RBE 3100 is used to satisfy this requirement, it does NOT count as part of the 6 units of CS." The v1 spec adds: "a non-CS Social Implications course meets the Social check without counting toward the CS units, and can fill another line it qualifies for. That reading shows 'Check this yourself'."

**Decision:** A non-CS Social Implications course (e.g., GOV 2314) satisfies the Social Implications check but does not consume a CS line. It can fill a Social Science line or free elective if eligible. The social check state includes "check-yourself" when satisfied by a non-CS course.

### 3. Cross-listed course, one course with multiple codes

The spec says: "A cross-listed course is one course with several codes. Listing both codes counts once." The cross-list rule (Note 2) says a cross-listed course can count toward only one of the three distribution areas (CS, Math, Science).

**Decision:** A student who takes CS 2022 counts toward CS first, under the code they listed. The course moves to a Math line only if that fills more lines overall, because the v1 spec asks for "whichever place helps most". If both codes appear in a history, only one counts; the other is Extra.

### 4. CS 5007 exclusion

The sheet says CS 5007 does not count toward the 5/3 units of 4000+ CS courses. It could still count as a general CS 2000+ course on lines 17-25.

**Decision:** CS 5007 is listed in exclusions with a note about the 4000+ requirement. The `subjectMinLevel` filter type (lines 26-30) excludes it. It can still match CS 2000+ lines 17-25.

### 5. Graduate course level parsing

The spec says: "a 3-digit number such as CS 502 is graduate level and counts as 4000+, even though 502 is less than 4000." The sheet lists CS 502, CS 533, CS 535 for Systems; CS 5003, CS 5084, CS 503, etc. for Theory.

**Decision:** The `subjectMinLevel` filter type must parse course numbers correctly: 3-digit codes ≥ 500 and 4-digit codes starting with 5+ are graduate and count as 4000+. This is handled by the matcher, not the rules file.

### 6. Graduate 2-for-3 equivalence

The sheet says: "2 graduate courses are the equivalent of 3 4000-level courses." The v1 spec says: "Each graduate course counts as one 4000+ course with no 2-for-3 bonus, and shows 'Check this yourself'."

**Decision:** Graduate courses count one-for-one in the `subjectMinLevel` filter. The 2-for-3 bonus is flagged as "check-yourself" via the `grad-equivalence` check.

### 7. MA 1000-level limit (Note 5)

The sheet says: "At most four 1000-level Mathematics courses may be counted toward this requirement."

**Decision:** This is a check (`ma-1000-limit`) with `maxCourses: 4` and `levelCeiling: 2000`. The matcher counts how many MA courses with level < 2000 are matched to math lines. If > 4, the check fails.

### 8. HUA depth and breadth

The sheet defines 5 groupings for breadth and requires depth of 3 thematically-related courses from the same grouping, with at least one at 2000-level or above. It also allows all-language students to pass breadth.

**Decision:** Depth and breadth are separate checks. Depth requires student confirmation (manual item `hua-depth-confirmation`). The all-language exception sets the breadth check to "check-yourself". If a student's HUA courses span more than one possible depth grouping, depth shows "check-yourself."

### 9. Free elective credit pool

The sheet shows 3 free elective lines at 1/3 unit each = 9 credits. The v1 spec says: "Courses of 3 or more credits fill one line. WPE classes fill WPE slots. Other courses from 0.75 to under 3 credits and unmatched courses go to the free elective pool by credit."

**Decision:** The free electives section has `creditPool: true` with `poolCredits: 9`. Small-credit courses and surplus courses accumulate in the pool. The 3 lines are a visual representation of the 9-credit pool.

### 10. WPE line structure

The sheet shows line 7 with 4 sub-slots for WPE classes. Each WPE class is approximately 1/12 unit (0.083333). The total is 4/12 = 1/3 unit.

**Decision:** Line 7 has `subSlots: 4` and `subSlotUnits: 0.083333`. WPE courses fill sub-slots, not full lines. The "club or varsity sports" alternative is a manual item.

### 11. Inquiry Seminar ordering

The sheet says: "All 5 HUA courses must be completed before beginning the Inquiry Seminar or Practicum."

**Decision:** Per the v1 spec, this is "shown as text and not enforced." The `orderNote` field records the rule, but no check enforces it.

### 12. Residency requirement

The sheet says: "Min. of 8 units must be completed at WPI."

**Decision:** This is a "check-yourself" check. The app cannot determine which courses were taken at WPI from course codes alone. The check appears once courses are present in the history.

## Test history coverage

### Mid-degree history (degree-history-mid.json)
- **22 taken courses, 2 planned** (sophomore entering 3rd year)
- Partial HUA (2 of 6 lines), partial WPE (2 of 4 sub-slots)
- Social Implications check not met (no course from the list)
- Systems and Theory checks met; Design planned; Social missing
- Science depth met (2 PH from one discipline, 3 total from BB/CH/GE/PH)
- Only-one-of not triggered (no duplicate sets)
- AP/IB limit met (1 AP course)
- MA 1000-level limit at maximum (4 courses)
- 15 lines unfilled, no surplus or Extra courses

### Complete-degree history (degree-history-complete.json)
- **43 taken courses** with all 45 lines filled (including 6 manual items)
- Only-one-of triggered: CS 2102 and CS 2103 both taken; CS 2102 used for CS, CS 2103 → free electives
- Non-CS Social Implications: GOV 2314 satisfies check but doesn't count as CS
- Surplus CS course: CS 3733 → free electives (16 eligible CS for 15 course lines)
- Extra course: GOV 2314 (check satisfied, no line available)
- Cross-listed CS 2022 used in CS section
- All 4 area checks met
- HUA depth confirmed by manual item, breadth met by PY (philosophy-religion outside EN/WR depth)
- All checks either met or check-yourself (residency, grad equivalence)
