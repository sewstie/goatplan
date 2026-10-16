#include <gtest/gtest.h>

#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <initializer_list>
#include <random>
#include <set>
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

void addOption(CourseChoices& choice, const WeekMask& mask) {
    choice.options.push_back(100 + choice.options.size() * 10);
    choice.masks.push_back(mask);
    choice.openSeats.push_back(-1);
}

CourseChoices choicesFromTimes(std::initializer_list<Time> times) {
    CourseChoices choice;
    for (const Time& time : times) {
        WeekMask mask;
        mask.addRange(time.day, time.start, time.end);
        addOption(choice, mask);
    }
    return choice;
}

CourseChoices sameTimeChoices(std::size_t count, Time time) {
    CourseChoices choice;
    WeekMask mask;
    mask.addRange(time.day, time.start, time.end);
    for (std::size_t i = 0; i < count; ++i) addOption(choice, mask);
    return choice;
}

CourseChoices threeTimesOn(int day) {
    return choicesFromTimes({{day, 600, 650}, {day, 660, 710}, {day, 720, 770}});
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

void expectAlternativesMatch(const std::vector<CourseChoices>& choices, const SolveResult& result) {
    for (const Schedule& schedule : result.schedules) {
        ASSERT_EQ(schedule.alternatives.size(), choices.size());
        for (std::size_t c = 0; c < choices.size(); ++c) {
            const Picks& alternatives = schedule.alternatives[c];
            EXPECT_TRUE(std::is_sorted(alternatives.begin(), alternatives.end()));
            EXPECT_NE(std::find(alternatives.begin(), alternatives.end(), schedule.picks[c]),
                      alternatives.end());
            for (std::size_t option : alternatives) {
                EXPECT_EQ(choices[c].masks[option], choices[c].masks[schedule.picks[c]]);
            }
        }
    }
}

WeekMask weekOf(const std::vector<CourseChoices>& choices, const Picks& picks) {
    WeekMask week;
    for (std::size_t i = 0; i < choices.size(); ++i) week |= choices[i].masks[picks[i]];
    return week;
}

std::vector<std::pair<int, Picks>> ranked(const SolveResult& result) {
    std::vector<std::pair<int, Picks>> list;
    for (const Schedule& schedule : result.schedules) list.emplace_back(schedule.score.total, schedule.picks);
    return list;
}

void expectBestFirst(const std::vector<CourseChoices>& choices, const SolveResult& result) {
    for (std::size_t s = 0; s < result.schedules.size(); ++s) {
        const Schedule& schedule = result.schedules[s];
        EXPECT_EQ(schedule.score.total, scoreOf(weekOf(choices, schedule.picks)).total);
        if (s > 0) EXPECT_LE(result.schedules[s - 1].score.total, schedule.score.total);
    }
}

// Each course picks its 8 options from only 4 times, so many of them share a time.
std::vector<CourseChoices> randomCourses(std::uint32_t seed) {
    std::mt19937 rng(seed);
    std::vector<CourseChoices> choices(3);
    for (CourseChoices& choice : choices) {
        std::vector<WeekMask> times(4);
        for (WeekMask& mask : times) {
            const int ranges = 1 + static_cast<int>(rng() % 2);
            for (int r = 0; r < ranges; ++r) {
                const int day = static_cast<int>(rng() % 3);
                const int start = 540 + static_cast<int>(rng() % 8) * 5;
                const int end = start + (1 + static_cast<int>(rng() % 3)) * 5;
                mask.addRange(day, start, end);
            }
        }
        for (int i = 0; i < 8; ++i) addOption(choice, times[rng() % times.size()]);
    }
    return choices;
}
}  // namespace

TEST(Solver, NoCoursesGivesEmptyResult) {
    const SolveResult result = solve({});
    EXPECT_EQ(result.total, 0u);
    EXPECT_EQ(result.patterns, 0u);
    EXPECT_EQ(result.steps, 0u);
    EXPECT_FALSE(result.capped);
    EXPECT_TRUE(result.schedules.empty());
}

// 9:00 is an hour early; 10:00 and 11:00 tie, so picks decide.
TEST(Solver, OneCourseComesBackBestFirst) {
    const SolveResult result = solve({choicesFromTimes({{0, 540, 590}, {0, 600, 650}, {0, 660, 710}})});
    EXPECT_EQ(result.total, 3u);
    EXPECT_EQ(result.patterns, 3u);
    EXPECT_EQ(result.steps, 3u);
    EXPECT_EQ(ranked(result), (std::vector<std::pair<int, Picks>>{{60, {1}}, {60, {2}}, {240, {0}}}));
}

TEST(Solver, IndependentCoursesGiveEveryCombination) {
    const auto choices = independentCourses();
    const SolveResult result = solve(choices);
    EXPECT_EQ(result.total, 6u);
    EXPECT_EQ(result.patterns, 6u);
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
    const SolveResult result = solve({threeTimesOn(0), CourseChoices{}}, limits);
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

// The second course is searched first because it has fewer times.
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

TEST(Solver, SameTimeOptionsShareASchedule) {
    const std::vector<CourseChoices> choices{
        sameTimeChoices(3, {0, 600, 650}),
        choicesFromTimes({{1, 600, 650}, {2, 660, 710}})
    };
    const SolveResult result = solve(choices);
    EXPECT_EQ(result.total, 6u);
    EXPECT_EQ(result.patterns, 2u);
    ASSERT_EQ(result.schedules.size(), 2u);
    for (const Schedule& schedule : result.schedules) {
        EXPECT_EQ(schedule.alternatives[0], Picks({0, 1, 2}));
        EXPECT_EQ(schedule.alternatives[1].size(), 1u);
    }
    expectConflictFree(choices, result);
    expectAlternativesMatch(choices, result);
}

TEST(Solver, ShowsTheAlternativeWithTheMostOpenSeats) {
    CourseChoices choice = sameTimeChoices(4, {0, 600, 650});
    auto shown = [&](std::vector<int> seats) {
        choice.openSeats = std::move(seats);
        const SolveResult result = solve({choice});
        EXPECT_EQ(result.schedules.at(0).alternatives[0], Picks({0, 1, 2, 3}));
        return result.schedules.at(0).picks[0];
    };
    EXPECT_EQ(shown({2, 7, -1, 7}), 1u);
    EXPECT_EQ(shown({-1, -1, 3, -1}), 2u);
    EXPECT_EQ(shown({-1, -1, -1, -1}), 0u);
    EXPECT_EQ(shown({0, 0, 0, 0}), 0u);
}

// 2500 real schedules, but only one time pattern to search.
TEST(Solver, IdenticalOptionsTakeTwoSteps) {
    const std::vector<CourseChoices> choices{
        sameTimeChoices(50, {0, 600, 650}),
        sameTimeChoices(50, {1, 600, 650})
    };
    const SolveResult result = solve(choices);
    EXPECT_EQ(result.total, 2500u);
    EXPECT_EQ(result.patterns, 1u);
    EXPECT_EQ(result.steps, 2u);
    ASSERT_EQ(result.schedules.size(), 1u);
    EXPECT_EQ(result.schedules[0].alternatives[0].size(), 50u);
    EXPECT_EQ(result.schedules[0].alternatives[1].size(), 50u);
}

TEST(Solver, MaxSchedulesDoesNotStopCounting) {
    const auto choices = independentCourses();
    SolveLimits limits;
    limits.maxSchedules = 2;
    const SolveResult limited = solve(choices, limits);
    const SolveResult full = solve(choices);
    EXPECT_EQ(limited.total, full.total);
    EXPECT_EQ(limited.patterns, full.patterns);
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
    EXPECT_EQ(result.patterns, 6u);
    EXPECT_TRUE(result.schedules.empty());
    EXPECT_FALSE(result.capped);
}

TEST(Solver, SmallBudgetStopsWithALowerBound) {
    const std::vector<CourseChoices> choices{threeTimesOn(0), threeTimesOn(1), threeTimesOn(2)};
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
    SolveResult result = solve({threeTimesOn(0)}, limits);
    EXPECT_TRUE(result.capped);
    EXPECT_EQ(result.total, 0u);
    EXPECT_EQ(result.steps, 1u);

    limits.stepBudget = 3;
    result = solve({threeTimesOn(0)}, limits);
    EXPECT_FALSE(result.capped);
    EXPECT_EQ(result.total, 3u);
    EXPECT_EQ(result.steps, 3u);

    limits.stepBudget = 2;
    result = solve({threeTimesOn(0)}, limits);
    EXPECT_TRUE(result.capped);
    EXPECT_EQ(result.total, 2u);
    EXPECT_EQ(result.steps, 3u);
}

TEST(Solver, StopAtFirstEndsAtTheFirstSchedule) {
    const std::vector<CourseChoices> choices{threeTimesOn(0), threeTimesOn(1), threeTimesOn(2)};
    SolveLimits limits;
    limits.stopAtFirst = true;
    const SolveResult result = solve(choices, limits);
    EXPECT_EQ(result.total, 1u);
    EXPECT_EQ(result.patterns, 1u);
    EXPECT_EQ(result.steps, 3u);
    EXPECT_FALSE(result.capped);
    EXPECT_TRUE(result.schedules.empty());
}

TEST(Solver, StopAtFirstStillSearchesEverythingWhenNothingFits) {
    const std::vector<CourseChoices> choices{
        choicesFromTimes({{0, 540, 590}, {0, 600, 650}}),
        choicesFromTimes({{0, 540, 590}, {0, 600, 650}}),
        choicesFromTimes({{0, 540, 590}, {0, 600, 650}})
    };
    SolveLimits limits;
    limits.stopAtFirst = true;
    const SolveResult result = solve(choices, limits);
    EXPECT_EQ(result.total, 0u);
    EXPECT_FALSE(result.capped);
    EXPECT_EQ(result.steps, solve(choices).steps);

    limits.stepBudget = 3;
    const SolveResult capped = solve(choices, limits);
    EXPECT_EQ(capped.total, 0u);
    EXPECT_TRUE(capped.capped);
}

TEST(Solver, MismatchedSizesThrow) {
    CourseChoices choice = threeTimesOn(0);
    choice.masks.pop_back();
    EXPECT_THROW(solve({choice}), std::invalid_argument);
    EXPECT_THROW(solve({choice, CourseChoices{}}), std::invalid_argument);

    choice = threeTimesOn(0);
    choice.openSeats.pop_back();
    EXPECT_THROW(solve({choice}), std::invalid_argument);
}

// Brute force goes through every real combination. Of those that share the same
// times, the one with the lowest positions stands for the pattern, as solve shows it.
TEST(Solver, MatchesBruteForceOnRandomCourses) {
    for (std::uint32_t seed = 0; seed < 20; ++seed) {
        SCOPED_TRACE(seed);
        const std::vector<CourseChoices> choices = randomCourses(seed);
        std::vector<Picks> firstWithMask(3, Picks(8));
        for (std::size_t c = 0; c < 3; ++c) {
            const auto& masks = choices[c].masks;
            for (std::size_t i = 0; i < 8; ++i) {
                firstWithMask[c][i] = static_cast<std::size_t>(
                    std::find(masks.begin(), masks.end(), masks[i]) - masks.begin());
            }
        }

        std::uint64_t real = 0;
        std::vector<std::pair<int, Picks>> expected;
        for (std::size_t x = 0; x < 8; ++x) {
            for (std::size_t y = 0; y < 8; ++y) {
                for (std::size_t z = 0; z < 8; ++z) {
                    const WeekMask& a = choices[0].masks[x];
                    const WeekMask& b = choices[1].masks[y];
                    const WeekMask& c = choices[2].masks[z];
                    if (a.intersects(b) || a.intersects(c) || b.intersects(c)) continue;
                    ++real;
                    if (x != firstWithMask[0][x] || y != firstWithMask[1][y] || z != firstWithMask[2][z]) continue;
                    expected.emplace_back(scoreOf(weekOf(choices, {x, y, z})).total, Picks{x, y, z});
                }
            }
        }
        std::sort(expected.begin(), expected.end());

        SolveLimits limits;
        limits.maxSchedules = 512;
        const SolveResult result = solve(choices, limits);
        EXPECT_FALSE(result.capped);
        EXPECT_EQ(result.total, real);
        EXPECT_EQ(result.patterns, expected.size());
        EXPECT_EQ(ranked(result), expected);
        expectConflictFree(choices, result);
        expectAlternativesMatch(choices, result);
        expectBestFirst(choices, result);

        limits.maxSchedules = 5;
        const SolveResult top = solve(choices, limits);
        EXPECT_EQ(top.total, real);
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
    EXPECT_EQ(first.patterns, second.patterns);
    EXPECT_EQ(first.steps, second.steps);
    EXPECT_EQ(ranked(first), ranked(second));
    for (std::size_t s = 0; s < first.schedules.size(); ++s) {
        EXPECT_EQ(first.schedules[s].alternatives, second.schedules[s].alternatives);
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
            std::set<std::pair<WeekMask, WeekMask>> patterns;
            for (const WeekMask& x : choices[0].masks) {
                for (const WeekMask& y : choices[1].masks) {
                    if (x.intersects(y)) continue;
                    ++expected;
                    patterns.emplace(x, y);
                }
            }
            const SolveResult result = solve(choices);
            EXPECT_EQ(result.total, expected);
            EXPECT_EQ(result.patterns, patterns.size());
            expectConflictFree(choices, result);
            expectAlternativesMatch(choices, result);
            expectBestFirst(choices, result);
            foundCompatiblePair = foundCompatiblePair || result.total > 0;
        }
    }
    EXPECT_TRUE(foundCompatiblePair);
}
