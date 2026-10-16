#include <gtest/gtest.h>

#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <initializer_list>
#include <random>
#include <stdexcept>
#include <string>
#include <utility>
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

WeekMask weekOf(const std::vector<CourseChoices>& choices, const Picks& picks) {
    WeekMask week;
    for (std::size_t i = 0; i < choices.size(); ++i) week |= choices[i].masks[picks[i]];
    return week;
}

// Each schedule as (score total, picks), which is also the order they should come in.
std::vector<std::pair<int, Picks>> ranked(const SolveResult& result) {
    std::vector<std::pair<int, Picks>> list;
    for (const Schedule& schedule : result.schedules) list.emplace_back(schedule.score.total, schedule.picks);
    return list;
}

void expectBestFirst(const std::vector<CourseChoices>& choices, const SolveResult& result) {
    for (const Schedule& schedule : result.schedules) {
        EXPECT_EQ(schedule.score.total, scoreOf(weekOf(choices, schedule.picks)).total);
    }
    const auto list = ranked(result);
    EXPECT_TRUE(std::is_sorted(list.begin(), list.end()));
}

std::vector<CourseChoices> randomCourses(std::uint32_t seed) {
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
    return choices;
}
}  // namespace

TEST(Solver, NoCoursesGivesEmptyResult) {
    const SolveResult result = solve({});
    EXPECT_EQ(result.total, 0u);
    EXPECT_EQ(result.steps, 0u);
    EXPECT_FALSE(result.capped);
    EXPECT_TRUE(result.schedules.empty());
}

// 9:00 is an hour early; 10:00 and 11:00 tie, so picks decide.
TEST(Solver, OneCourseComesBackBestFirst) {
    const SolveResult result = solve({choicesFromTimes({{0, 540, 590}, {0, 600, 650}, {0, 660, 710}})});
    EXPECT_EQ(result.total, 3u);
    EXPECT_EQ(result.steps, 3u);
    EXPECT_EQ(ranked(result), (std::vector<std::pair<int, Picks>>{{60, {1}}, {60, {2}}, {240, {0}}}));
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
    expectBestFirst(choices, result);
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

// Every combination is two 10:00 classes on two days, so all four tie.
TEST(Solver, EqualScoresAreOrderedByPicks) {
    SolveLimits limits;
    limits.maxSchedules = 2;
    const SolveResult result = solve({
        choicesFromTimes({{0, 600, 650}, {2, 600, 650}}),
        choicesFromTimes({{1, 600, 650}, {3, 600, 650}})
    }, limits);
    EXPECT_EQ(result.total, 4u);
    EXPECT_EQ(ranked(result), (std::vector<std::pair<int, Picks>>{{120, {0, 0}}, {120, {0, 1}}}));
}

// The search finds 8:00 + 8:00 first, and it is the worst of the four.
TEST(Solver, KeepsTheBestEvenWhenItIsFoundLast) {
    const std::vector<CourseChoices> choices{
        choicesFromTimes({{0, 480, 530}, {0, 660, 710}}),
        choicesFromTimes({{1, 480, 530}, {1, 660, 710}})
    };
    SolveLimits limits;
    limits.maxSchedules = 1;
    const SolveResult result = solve(choices, limits);
    EXPECT_EQ(result.total, 4u);
    ASSERT_EQ(result.schedules.size(), 1u);
    EXPECT_EQ(result.schedules[0].picks, Picks({1, 1}));
    EXPECT_EQ(result.schedules[0].score.total, 120);

    const SolveResult all = solve(choices);
    ASSERT_EQ(all.schedules.size(), 4u);
    EXPECT_EQ(all.schedules.back().picks, Picks({0, 0}));
}

TEST(Solver, PassesWeightsToTheScore) {
    const std::vector<CourseChoices> choices{choicesFromTimes({{0, 540, 590}, {0, 600, 650}})};
    ScoreWeights weights;
    weights.earlyCutoff = 8 * 60;
    weights.perDay = 1;
    const SolveResult result = solve(choices, SolveLimits{}, weights);
    EXPECT_EQ(ranked(result), (std::vector<std::pair<int, Picks>>{{1, {0}}, {1, {1}}}));
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

// Brute force scores every clash-free combination and sorts them the way solve should.
TEST(Solver, MatchesBruteForceOnRandomCourses) {
    for (std::uint32_t seed = 0; seed < 20; ++seed) {
        SCOPED_TRACE(seed);
        const std::vector<CourseChoices> choices = randomCourses(seed);
        std::vector<std::pair<int, Picks>> expected;
        for (std::size_t x = 0; x < 6; ++x) {
            for (std::size_t y = 0; y < 6; ++y) {
                for (std::size_t z = 0; z < 6; ++z) {
                    const WeekMask& a = choices[0].masks[x];
                    const WeekMask& b = choices[1].masks[y];
                    const WeekMask& c = choices[2].masks[z];
                    if (a.intersects(b) || a.intersects(c) || b.intersects(c)) continue;
                    expected.emplace_back(scoreOf(weekOf(choices, {x, y, z})).total, Picks{x, y, z});
                }
            }
        }
        std::sort(expected.begin(), expected.end());

        SolveLimits limits;
        limits.maxSchedules = 216;
        const SolveResult result = solve(choices, limits);
        EXPECT_FALSE(result.capped);
        EXPECT_EQ(result.total, expected.size());
        EXPECT_EQ(ranked(result), expected);
        expectConflictFree(choices, result);
        expectBestFirst(choices, result);

        limits.maxSchedules = 5;
        const SolveResult top = solve(choices, limits);
        EXPECT_EQ(top.total, expected.size());
        expected.resize(std::min<std::size_t>(expected.size(), 5));
        EXPECT_EQ(ranked(top), expected);
    }
}

TEST(Solver, SameInputGivesSameResult) {
    const std::vector<CourseChoices> choices = randomCourses(7);
    SolveLimits limits;
    limits.maxSchedules = 10;
    const SolveResult first = solve(choices, limits);
    const SolveResult second = solve(choices, limits);
    ASSERT_FALSE(first.schedules.empty());
    EXPECT_EQ(first.total, second.total);
    EXPECT_EQ(first.steps, second.steps);
    EXPECT_EQ(ranked(first), ranked(second));
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
            expectBestFirst(choices, result);
            foundCompatiblePair = foundCompatiblePair || result.total > 0;
        }
    }
    EXPECT_TRUE(foundCompatiblePair);
}
