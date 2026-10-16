#include <gtest/gtest.h>

#include <cstddef>
#include <cstdint>
#include <string>
#include <utility>
#include <vector>

#include "goatplan/diagnose.hpp"
#include "goatplan/json_io.hpp"
#include "test_helpers.hpp"

using namespace goatplan;
using goatplan::test::makeTerm;
using goatplan::test::TestSection;

namespace {
using Pairs = std::vector<std::pair<std::size_t, std::size_t>>;
using Indexes = std::vector<std::size_t>;
using Fixes = std::vector<Fix>;

std::size_t reasonIndex(FilterReason reason) { return static_cast<std::size_t>(reason); }

TestSection at(DayMask days, int hour, SectionStatus status = SectionStatus::Open) {
    return {days, hour * 60, hour * 60 + 50, status};
}

std::uint64_t totalWith(const Term& term, std::vector<std::string> codes, Preferences prefs,
                        const Fix& fix) {
    switch (fix.kind) {
        case FixKind::RelaxStartsAfter: prefs.startsAfter = fix.startsAfter < 0 ? 0 : fix.startsAfter; break;
        case FixKind::ClearBlocked: prefs.blocked = WeekMask{}; break;
        case FixKind::AllowFull: prefs.onlyOpen = false; break;
        case FixKind::Unlock: prefs.locked.erase(codes.at(fix.course)); break;
        case FixKind::DropCourse: codes.erase(codes.begin() + static_cast<std::ptrdiff_t>(fix.course)); break;
    }
    return solve(filterOptions(term, codes, prefs)).total;
}

Term threeWayClash() {
    return makeTerm({
        {"A", {at(Monday, 9), at(Monday, 10)}},
        {"B", {at(Monday, 9), at(Monday, 10)}},
        {"C", {at(Monday, 9), at(Monday, 10)}},
        {"D", {at(Monday, 14)}}
    });
}

// A is emptied by three different rules, and undoing any one of them brings it back.
struct EveryRule {
    Term term = makeTerm({
        {"A", {at(Monday, 8), at(Monday, 9), at(Tuesday, 10, SectionStatus::Waitlist), at(Wednesday, 10)}},
        {"B", {at(Monday, 10), at(Thursday, 10)}}
    });
    std::vector<std::string> codes{"A", "B"};
    Preferences prefs;
    EveryRule() {
        prefs.onlyOpen = true;
        prefs.startsAfter = 600;
        prefs.blocked.addRange(2, 600, 660);
    }
};
}  // namespace

TEST(Diagnose, NothingToExplainWhenSchedulesExist) {
    const Term term = makeTerm({{"A", {at(Monday, 9)}}, {"B", {at(Monday, 10)}}});
    EXPECT_EQ(diagnose(term, {"A", "B"}, Preferences{}), Diagnosis{.ok = true});
}

TEST(Diagnose, LateStartEmptiesACourse) {
    const Term term = makeTerm({
        {"A", {at(Monday, 9), at(Tuesday, 11), at(Wednesday, 13)}},
        {"B", {at(Monday, 15)}}
    });
    Preferences prefs;
    prefs.startsAfter = 15 * 60;
    const Diagnosis diagnosis = diagnose(term, {"A", "B"}, prefs);
    EXPECT_FALSE(diagnosis.ok);
    EXPECT_FALSE(diagnosis.unsure);
    ASSERT_EQ(diagnosis.emptyCourses.size(), 1u);
    const EmptyCourse& empty = diagnosis.emptyCourses[0];
    EXPECT_EQ(empty.course, 0u);
    EXPECT_EQ(empty.optionsInData, 3);
    EXPECT_EQ(empty.removed[reasonIndex(FilterReason::StartsTooEarly)], 3);
    EXPECT_EQ(empty.latestStartsAfter, 13 * 60);
    EXPECT_TRUE(diagnosis.clashingPairs.empty());
    EXPECT_TRUE(diagnosis.minimalClash.empty());
    EXPECT_EQ(diagnosis.fixes, (Fixes{{FixKind::RelaxStartsAfter, 0, 13 * 60, 1},
                                     {FixKind::DropCourse, 0, -1, 1}}));
}

TEST(Diagnose, CourseWithNoOptionsInTheData) {
    const Term term = makeTerm({{"A", {at(Monday, 9)}}, {"NONE", {}}});
    const Diagnosis diagnosis = diagnose(term, {"A", "NONE"}, Preferences{});
    EXPECT_EQ(diagnosis.emptyCourses, (std::vector<EmptyCourse>{{1, 0, {}, -1}}));
    EXPECT_EQ(diagnosis.fixes, (Fixes{{FixKind::DropCourse, 1, -1, 1}}));
}

TEST(Diagnose, TwoCoursesAtTheSameTime) {
    const Term term = makeTerm({
        {"A", {at(Monday, 9)}},
        {"B", {at(Monday, 9)}},
        {"C", {at(Tuesday, 9)}}
    });
    const Diagnosis diagnosis = diagnose(term, {"A", "B", "C"}, Preferences{});
    EXPECT_TRUE(diagnosis.emptyCourses.empty());
    EXPECT_EQ(diagnosis.clashingPairs, (Pairs{{0, 1}}));
    EXPECT_TRUE(diagnosis.minimalClash.empty());
    EXPECT_EQ(diagnosis.fixes, (Fixes{{FixKind::DropCourse, 0, -1, 1}, {FixKind::DropCourse, 1, -1, 1}}));
}

TEST(Diagnose, ThreeCoursesForTwoTimes) {
    const Diagnosis diagnosis = diagnose(threeWayClash(), {"A", "B", "C"}, Preferences{});
    EXPECT_TRUE(diagnosis.emptyCourses.empty());
    EXPECT_TRUE(diagnosis.clashingPairs.empty());
    EXPECT_EQ(diagnosis.minimalClash, (Indexes{0, 1, 2}));
    EXPECT_EQ(diagnosis.fixes, (Fixes{{FixKind::DropCourse, 0, -1, 2},
                                     {FixKind::DropCourse, 1, -1, 2},
                                     {FixKind::DropCourse, 2, -1, 2}}));
}

TEST(Diagnose, MinimalClashLeavesOutCoursesThatFit) {
    const Diagnosis diagnosis = diagnose(threeWayClash(), {"D", "A", "B", "C"}, Preferences{});
    EXPECT_TRUE(diagnosis.clashingPairs.empty());
    EXPECT_EQ(diagnosis.minimalClash, (Indexes{1, 2, 3}));
    for (const Fix& fix : diagnosis.fixes) EXPECT_NE(fix.course, 0u);
}

TEST(Diagnose, EverySuggestedFixWorks) {
    const EveryRule input;
    const Diagnosis diagnosis = diagnose(input.term, input.codes, input.prefs);
    ASSERT_EQ(diagnosis.emptyCourses.size(), 1u);
    const EmptyCourse& empty = diagnosis.emptyCourses[0];
    EXPECT_EQ(empty.removed[reasonIndex(FilterReason::StartsTooEarly)], 2);
    EXPECT_EQ(empty.removed[reasonIndex(FilterReason::NotOpen)], 1);
    EXPECT_EQ(empty.removed[reasonIndex(FilterReason::Blocked)], 1);
    EXPECT_EQ(empty.latestStartsAfter, 9 * 60);

    ASSERT_EQ(diagnosis.fixes.size(), 4u);
    EXPECT_EQ(diagnosis.fixes[0].kind, FixKind::RelaxStartsAfter);
    EXPECT_EQ(diagnosis.fixes[0].startsAfter, 9 * 60);
    EXPECT_EQ(diagnosis.fixes[1].kind, FixKind::ClearBlocked);
    EXPECT_EQ(diagnosis.fixes[2].kind, FixKind::AllowFull);
    EXPECT_EQ(diagnosis.fixes[3].kind, FixKind::DropCourse);
    for (const Fix& fix : diagnosis.fixes) {
        EXPECT_GT(fix.schedules, 0u);
        EXPECT_FALSE(fix.capped);
        EXPECT_EQ(totalWith(input.term, input.codes, input.prefs, fix), fix.schedules);
    }
}

TEST(Diagnose, PreferenceFixesComeBeforeDroppingACourse) {
    const Term term = makeTerm({
        {"A", {at(Monday, 9), {Tuesday, 480, 590}, at(Wednesday, 9, SectionStatus::Waitlist)}},
        {"B", {{Monday | Tuesday, 540, 590}, {Monday | Tuesday, 540, 590}, at(Monday, 9)}}
    });
    Preferences prefs;
    prefs.startsAfter = 9 * 60;
    prefs.onlyOpen = true;
    const Diagnosis diagnosis = diagnose(term, {"A", "B"}, prefs);
    EXPECT_EQ(diagnosis.clashingPairs, (Pairs{{0, 1}}));
    EXPECT_EQ(diagnosis.fixes, (Fixes{{FixKind::AllowFull, 0, -1, 3},
                                     {FixKind::RelaxStartsAfter, 0, -1, 1},
                                     {FixKind::DropCourse, 0, -1, 3},
                                     {FixKind::DropCourse, 1, -1, 1}}));
}

TEST(Diagnose, SuggestsUnlockingALockedCourse) {
    const Term term = makeTerm({{"A", {at(Monday, 9), at(Tuesday, 9)}}, {"B", {at(Monday, 9)}}});
    Preferences prefs;
    prefs.locked["A"] = {"A-0"};
    const Diagnosis diagnosis = diagnose(term, {"A", "B"}, prefs);
    EXPECT_EQ(diagnosis.clashingPairs, (Pairs{{0, 1}}));
    ASSERT_FALSE(diagnosis.fixes.empty());
    EXPECT_EQ(diagnosis.fixes[0], (Fix{FixKind::Unlock, 0, -1, 1}));
}

TEST(Diagnose, TinyBudgetMakesNoClaims) {
    SolveLimits limits;
    limits.stepBudget = 3;
    const Diagnosis diagnosis = diagnose(threeWayClash(), {"A", "B", "C"}, Preferences{}, limits);
    EXPECT_EQ(diagnosis, Diagnosis{.unsure = true});
}

TEST(Diagnose, SameInputGivesSameDiagnosis) {
    const Term term = loadTermFile(GOATPLAN_FIXTURES "/2027-C.small.json");
    Preferences prefs;
    prefs.startsAfter = 10 * 60;
    prefs.onlyOpen = true;
    const Diagnosis first = diagnose(term, {"AE 2320", "AE 4310"}, prefs);
    ASSERT_FALSE(first.emptyCourses.empty());
    ASSERT_FALSE(first.fixes.empty());
    EXPECT_EQ(first, diagnose(term, {"AE 2320", "AE 4310"}, prefs));

    const EveryRule input;
    EXPECT_EQ(diagnose(input.term, input.codes, input.prefs), diagnose(input.term, input.codes, input.prefs));
}
