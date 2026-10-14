#include <gtest/gtest.h>

#include <cstddef>
#include <cstdint>
#include <initializer_list>
#include <random>
#include <stdexcept>
#include <string>
#include <vector>

#include "goatplan/json_io.hpp"
#include "goatplan/solver.hpp"

using namespace goatplan;

namespace {
using Picks = std::vector<std::size_t>;

struct Time { int day; int start; int end; };

CourseChoices choicesFromTimes(std::initializer_list<Time> times) {
    CourseChoices choice;
    for (const Time& time : times) {
        choice.options.push_back(100 + choice.options.size() * 10);
        WeekMask mask;
        mask.addRange(time.day, time.start, time.end);
        choice.masks.push_back(mask);
    }
    return choice;
}

CourseChoices untimedChoices(std::size_t count) {
    CourseChoices choice;
    for (std::size_t i = 0; i < count; ++i) {
        choice.options.push_back(100 + i * 10);
        choice.masks.push_back(WeekMask{});
    }
    return choice;
}

std::vector<CourseChoices> independentCourses() {
    return {
        choicesFromTimes({{0, 540, 590}, {0, 600, 650}}),
        choicesFromTimes({{1, 540, 590}, {1, 600, 650}, {1, 660, 710}})
    };
}

void expectConflictFree(const std::vector<CourseChoices>& choices, const SolveResult& result) {
    for (const Schedule& schedule : result.schedules) {
        ASSERT_EQ(schedule.picks.size(), choices.size());
        for (std::size_t i = 0; i < choices.size(); ++i) {
            ASSERT_LT(schedule.picks[i], choices[i].options.size());
            for (std::size_t j = i + 1; j < choices.size(); ++j) {
                EXPECT_FALSE(choices[i].masks[schedule.picks[i]].intersects(
                    choices[j].masks[schedule.picks[j]]));
            }
        }
    }
}
}  // namespace

TEST(Solver, NoCoursesGivesEmptyResult) {
    const SolveResult result = solve({});
    EXPECT_EQ(result.total, 0u);
    EXPECT_EQ(result.steps, 0u);
    EXPECT_FALSE(result.capped);
    EXPECT_TRUE(result.schedules.empty());
}

TEST(Solver, OneCourseKeepsOptionOrder) {
    const SolveResult result = solve({choicesFromTimes({{0, 540, 590}, {0, 600, 650}, {0, 660, 710}})});
    EXPECT_EQ(result.total, 3u);
    EXPECT_EQ(result.steps, 3u);
    ASSERT_EQ(result.schedules.size(), 3u);
    for (std::size_t i = 0; i < 3; ++i) EXPECT_EQ(result.schedules[i].picks, Picks({i}));
}

TEST(Solver, IndependentCoursesGiveEveryCombination) {
    const auto choices = independentCourses();
    const SolveResult result = solve(choices);
    EXPECT_EQ(result.total, 6u);
    EXPECT_EQ(result.schedules.size(), 6u);
    EXPECT_EQ(result.steps, 8u);
    EXPECT_FALSE(result.capped);
    expectConflictFree(choices, result);
}

TEST(Solver, CoursesAtTheSameTimeGiveNothing) {
    const SolveResult result = solve({choicesFromTimes({{0, 540, 590}}), choicesFromTimes({{0, 540, 590}})});
    EXPECT_EQ(result.total, 0u);
    EXPECT_EQ(result.steps, 2u);
    EXPECT_FALSE(result.capped);
}

TEST(Solver, CourseWithNoOptionsStopsBeforeSearching) {
    SolveLimits limits;
    limits.stepBudget = 0;
    const SolveResult result = solve({untimedChoices(3), CourseChoices{}}, limits);
    EXPECT_EQ(result.total, 0u);
    EXPECT_EQ(result.steps, 0u);
    EXPECT_FALSE(result.capped);
}

TEST(Solver, ReturnedSchedulesHaveNoClashes) {
    const std::vector<CourseChoices> choices{
        choicesFromTimes({{0, 540, 590}, {0, 600, 650}, {1, 540, 590}}),
        choicesFromTimes({{0, 570, 620}, {2, 540, 590}}),
        choicesFromTimes({{0, 590, 640}, {3, 540, 590}})
    };
    const SolveResult result = solve(choices);
    EXPECT_GT(result.total, 0u);
    expectConflictFree(choices, result);
}

// The second course is searched first because it has fewer options.
TEST(Solver, PicksStayInInputOrder) {
    const std::vector<CourseChoices> choices{
        choicesFromTimes({{0, 540, 590}, {1, 540, 590}, {0, 550, 600}}),
        choicesFromTimes({{0, 540, 590}})
    };
    const SolveResult result = solve(choices);
    ASSERT_EQ(result.total, 1u);
    ASSERT_EQ(result.schedules.size(), 1u);
    EXPECT_EQ(result.schedules[0].picks, Picks({1, 0}));
    EXPECT_EQ(choices[0].options[result.schedules[0].picks[0]], 110u);
}

TEST(Solver, EqualSizeCoursesKeepTheirOrder) {
    SolveLimits limits;
    limits.maxSchedules = 2;
    const SolveResult result = solve({
        choicesFromTimes({{0, 540, 590}, {0, 600, 650}}),
        choicesFromTimes({{1, 540, 590}, {1, 600, 650}})
    }, limits);
    EXPECT_EQ(result.total, 4u);
    ASSERT_EQ(result.schedules.size(), 2u);
    EXPECT_EQ(result.schedules[0].picks, Picks({0, 0}));
    EXPECT_EQ(result.schedules[1].picks, Picks({0, 1}));
}

TEST(Solver, MaxSchedulesDoesNotStopCounting) {
    const auto choices = independentCourses();
    SolveLimits limits;
    limits.maxSchedules = 2;
    const SolveResult limited = solve(choices, limits);
    const SolveResult full = solve(choices);
    EXPECT_EQ(limited.total, full.total);
    EXPECT_EQ(limited.steps, full.steps);
    EXPECT_FALSE(limited.capped);
    ASSERT_EQ(limited.schedules.size(), 2u);
    EXPECT_EQ(limited.schedules[0].picks, full.schedules[0].picks);
    EXPECT_EQ(limited.schedules[1].picks, full.schedules[1].picks);
}

TEST(Solver, ZeroMaxSchedulesStillCounts) {
    SolveLimits limits;
    limits.maxSchedules = 0;
    const SolveResult result = solve(independentCourses(), limits);
    EXPECT_EQ(result.total, 6u);
    EXPECT_TRUE(result.schedules.empty());
    EXPECT_FALSE(result.capped);
}

TEST(Solver, SmallBudgetStopsWithALowerBound) {
    const std::vector<CourseChoices> choices{untimedChoices(3), untimedChoices(3), untimedChoices(3)};
    SolveLimits limits;
    limits.stepBudget = 5;
    const SolveResult result = solve(choices, limits);
    EXPECT_TRUE(result.capped);
    EXPECT_EQ(result.steps, 6u);
    EXPECT_EQ(result.total, 3u);
    EXPECT_LE(result.total, solve(choices).total);
    EXPECT_EQ(result.schedules.size(), result.total);
    expectConflictFree(choices, result);
}

TEST(Solver, BudgetBoundaries) {
    SolveLimits limits;
    limits.stepBudget = 0;
    SolveResult result = solve({untimedChoices(3)}, limits);
    EXPECT_TRUE(result.capped);
    EXPECT_EQ(result.total, 0u);
    EXPECT_EQ(result.steps, 1u);

    limits.stepBudget = 3;
    result = solve({untimedChoices(3)}, limits);
    EXPECT_FALSE(result.capped);
    EXPECT_EQ(result.total, 3u);
    EXPECT_EQ(result.steps, 3u);

    limits.stepBudget = 2;
    result = solve({untimedChoices(3)}, limits);
    EXPECT_TRUE(result.capped);
    EXPECT_EQ(result.total, 2u);
    EXPECT_EQ(result.steps, 3u);
}

TEST(Solver, MismatchedMasksThrow) {
    CourseChoices choice = untimedChoices(2);
    choice.masks.pop_back();
    EXPECT_THROW(solve({choice}), std::invalid_argument);
    EXPECT_THROW(solve({choice, CourseChoices{}}), std::invalid_argument);
}

TEST(Solver, MatchesBruteForceOnRandomCourses) {
    for (std::uint32_t seed = 0; seed < 20; ++seed) {
        SCOPED_TRACE(seed);
        std::mt19937 rng(seed);
        std::vector<CourseChoices> choices(3);
        for (CourseChoices& choice : choices) {
            for (std::size_t i = 0; i < 6; ++i) {
                WeekMask mask;
                const int ranges = 1 + static_cast<int>(rng() % 2);
                for (int r = 0; r < ranges; ++r) {
                    const int day = static_cast<int>(rng() % 3);
                    const int start = 540 + static_cast<int>(rng() % 8) * 5;
                    const int end = start + (1 + static_cast<int>(rng() % 3)) * 5;
                    mask.addRange(day, start, end);
                }
                choice.options.push_back(100 + i);
                choice.masks.push_back(mask);
            }
        }
        std::uint64_t expected = 0;
        for (const WeekMask& x : choices[0].masks) {
            for (const WeekMask& y : choices[1].masks) {
                for (const WeekMask& z : choices[2].masks) {
                    if (!x.intersects(y) && !x.intersects(z) && !y.intersects(z)) ++expected;
                }
            }
        }
        SolveLimits limits;
        limits.maxSchedules = 216;
        const SolveResult result = solve(choices, limits);
        EXPECT_FALSE(result.capped);
        EXPECT_EQ(result.total, expected);
        EXPECT_EQ(result.schedules.size(), expected);
        expectConflictFree(choices, result);
        std::vector<bool> seen(216, false);
        for (const Schedule& schedule : result.schedules) {
            const Picks& p = schedule.picks;
            const std::size_t key = p[0] * 36 + p[1] * 6 + p[2];
            EXPECT_FALSE(seen[key]);
            seen[key] = true;
        }
    }
}

TEST(Solver, MatchesBruteForceOnFixture) {
    const Term term = loadTermFile(GOATPLAN_FIXTURES "/2027-C.small.json");
    ASSERT_GE(term.courses.size(), 2u);
    bool foundCompatiblePair = false;
    for (std::size_t i = 0; i < term.courses.size(); ++i) {
        for (std::size_t j = i + 1; j < term.courses.size(); ++j) {
            SCOPED_TRACE(term.courses[i].code + " + " + term.courses[j].code);
            const auto choices = filterOptions(
                term, {term.courses[i].code, term.courses[j].code}, Preferences{});
            std::uint64_t expected = 0;
            for (const WeekMask& x : choices[0].masks) {
                for (const WeekMask& y : choices[1].masks) {
                    if (!x.intersects(y)) ++expected;
                }
            }
            const SolveResult result = solve(choices);
            EXPECT_EQ(result.total, expected);
            expectConflictFree(choices, result);
            foundCompatiblePair = foundCompatiblePair || result.total > 0;
        }
    }
    EXPECT_TRUE(foundCompatiblePair);
}
