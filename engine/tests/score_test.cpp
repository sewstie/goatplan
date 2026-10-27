#include <gtest/gtest.h>

#include <compare>

#include "goatplan/score.hpp"
#include "goatplan/week_mask.hpp"

using namespace goatplan;

namespace {
constexpr int at(int hour, int minute) { return hour * 60 + minute; }

constexpr int kMon = 0;
constexpr int kTue = 1;
constexpr int kWed = 2;
constexpr int kFri = 4;
}

TEST(Score, EmptyWeekScoresZero) {
    const Score score = scoreOf(WeekMask{});
    EXPECT_EQ(score.earlyMinutes, 0);
    EXPECT_EQ(score.gapMinutes, 0);
    EXPECT_EQ(score.days, 0);
    EXPECT_EQ(score.total, 0);
}

TEST(Score, NineAmClassIsAnHourEarly) {
    WeekMask week;
    week.addRange(kMon, at(9, 0), at(9, 50));
    const Score score = scoreOf(week);
    EXPECT_EQ(score.earlyMinutes, 60);
    EXPECT_EQ(score.gapMinutes, 0);
    EXPECT_EQ(score.days, 1);
    EXPECT_EQ(score.total, 60 * 3 + 60);
}

TEST(Score, TenAmClassIsNotEarly) {
    WeekMask week;
    week.addRange(kMon, at(10, 0), at(10, 50));
    EXPECT_EQ(scoreOf(week).earlyMinutes, 0);
}

TEST(Score, EmptyTimeBetweenClassesIsAGap) {
    WeekMask week;
    week.addRange(kMon, at(9, 0), at(9, 50));
    week.addRange(kMon, at(11, 0), at(11, 50));
    EXPECT_EQ(scoreOf(week).gapMinutes, 70);
}

TEST(Score, CountsDaysWithClasses) {
    WeekMask week;
    week.addRange(kMon, at(10, 0), at(10, 50));
    week.addRange(kWed, at(10, 0), at(10, 50));
    const Score score = scoreOf(week);
    EXPECT_EQ(score.days, 2);
    EXPECT_EQ(score.gapMinutes, 0);
}

TEST(Score, TotalUsesTheGivenWeights) {
    WeekMask week;
    week.addRange(kMon, at(9, 0), at(9, 50));
    week.addRange(kMon, at(11, 0), at(11, 50));
    week.addRange(kWed, at(8, 0), at(8, 50));

    ScoreWeights weights;
    weights.earlyCutoff = at(9, 30);
    weights.perEarlyMinute = 2;
    weights.perGapMinute = 5;
    weights.perDay = 100;
    const Score score = scoreOf(week, weights);
    EXPECT_EQ(score.earlyMinutes, 30 + 90);
    EXPECT_EQ(score.gapMinutes, 70);
    EXPECT_EQ(score.days, 2);
    EXPECT_EQ(score.total, 120 * 2 + 70 * 5 + 2 * 100);
}

TEST(Score, DefaultLateCutoffGivesZeroLateMinutes) {
    WeekMask week;
    week.addRange(kMon, at(10, 0), at(17, 0));
    const Score score = scoreOf(week);
    EXPECT_EQ(score.lateMinutes, 0);
}

TEST(Score, ClassAfterCutoffCountsAsLate) {
    WeekMask week;
    week.addRange(kMon, at(10, 0), at(16, 0));
    ScoreWeights weights;
    weights.lateCutoff = at(15, 0);
    weights.perLateMinute = 1;
    const Score score = scoreOf(week, weights);
    EXPECT_EQ(score.lateMinutes, 60);
}

TEST(Score, ClassEndingAtCutoffIsNotLate) {
    WeekMask week;
    week.addRange(kMon, at(10, 0), at(15, 0));
    ScoreWeights weights;
    weights.lateCutoff = at(15, 0);
    weights.perLateMinute = 10;
    const Score score = scoreOf(week, weights);
    EXPECT_EQ(score.lateMinutes, 0);
}

TEST(Score, LateMinutesCountedPerDay) {
    WeekMask week;
    week.addRange(kMon, at(10, 0), at(16, 0));
    week.addRange(kWed, at(10, 0), at(17, 0));
    ScoreWeights weights;
    weights.lateCutoff = at(15, 0);
    weights.perLateMinute = 1;
    const Score score = scoreOf(week, weights);
    EXPECT_EQ(score.lateMinutes, 60 + 120);
    EXPECT_EQ(score.days, 2);
}

TEST(Score, LateMinutesAddToTotal) {
    WeekMask week;
    week.addRange(kMon, at(10, 0), at(16, 0));
    ScoreWeights weights;
    weights.earlyCutoff = at(10, 0);
    weights.perEarlyMinute = 0;
    weights.lateCutoff = at(15, 0);
    weights.perLateMinute = 7;
    weights.perGapMinute = 0;
    weights.perDay = 0;
    const Score score = scoreOf(week, weights);
    EXPECT_EQ(score.lateMinutes, 60);
    EXPECT_EQ(score.total, 60 * 7);
}

TEST(Score, EmptyWeekHasNoTimes) {
    const Score score = scoreOf(WeekMask{});
    EXPECT_EQ(score.firstStart, 0);
    EXPECT_EQ(score.lastEnd, 0);
    EXPECT_EQ(score.averageStart, 0);
    EXPECT_EQ(score.averageEnd, 0);
    EXPECT_EQ(score.freeMinutes, 0);
}

TEST(Score, FirstStartAndLastEndCoverTheWholeWeek) {
    WeekMask week;
    week.addRange(kMon, at(10, 0), at(10, 50));
    week.addRange(kMon, at(13, 0), at(14, 15));
    week.addRange(kWed, at(9, 0), at(9, 50));
    week.addRange(kFri, at(11, 0), at(15, 50));
    const Score score = scoreOf(week);
    EXPECT_EQ(score.firstStart, at(9, 0));
    EXPECT_EQ(score.lastEnd, at(15, 50));
}

TEST(Score, AveragesUseOnlyDaysWithClass) {
    WeekMask week;
    week.addRange(kMon, at(9, 0), at(9, 50));
    week.addRange(kWed, at(10, 0), at(12, 0));
    const Score score = scoreOf(week);
    EXPECT_EQ(score.days, 2);
    EXPECT_EQ(score.averageStart, at(9, 30));
    EXPECT_EQ(score.averageEnd, at(10, 55));
}

TEST(Score, AveragesRoundToTheNearestMinuteWithHalvesUp) {
    WeekMask twoDays;
    twoDays.addRange(kMon, at(10, 0), at(10, 50));
    twoDays.addRange(kTue, at(10, 5), at(10, 55));
    EXPECT_EQ(scoreOf(twoDays).averageStart, at(10, 3));
    EXPECT_EQ(scoreOf(twoDays).averageEnd, at(10, 53));

    WeekMask threeDays = twoDays;
    threeDays.addRange(kWed, at(10, 5), at(10, 55));
    EXPECT_EQ(scoreOf(threeDays).averageStart, at(10, 3));
    EXPECT_EQ(scoreOf(threeDays).averageEnd, at(10, 53));
}

TEST(Score, BackToBackTenMinuteBreaksAreNotFreeMinutes) {
    WeekMask week;
    week.addRange(kMon, at(9, 0), at(9, 50));
    week.addRange(kMon, at(10, 0), at(10, 50));
    week.addRange(kMon, at(11, 0), at(11, 50));
    const Score score = scoreOf(week);
    EXPECT_EQ(score.gapMinutes, 20);
    EXPECT_EQ(score.freeMinutes, 0);
}

TEST(Score, BreaksLongerThanTenMinutesAreFreeMinutes) {
    WeekMask week;
    week.addRange(kMon, at(9, 0), at(9, 50));
    week.addRange(kMon, at(10, 5), at(10, 55));
    week.addRange(kMon, at(11, 5), at(11, 50));
    week.addRange(kMon, at(12, 55), at(13, 45));
    week.addRange(kWed, at(9, 0), at(9, 50));
    week.addRange(kWed, at(12, 0), at(12, 50));
    const Score score = scoreOf(week);
    EXPECT_EQ(score.gapMinutes, 15 + 10 + 65 + 130);
    EXPECT_EQ(score.freeMinutes, 15 + 65 + 130);
}

TEST(Score, CompareWithoutPrimaryUsesTheTotal) {
    Score low;
    low.total = 10;
    low.days = 5;
    Score high;
    high.total = 20;
    high.days = 1;
    EXPECT_TRUE(std::is_lt(compareScores(low, high)));
    EXPECT_TRUE(std::is_gt(compareScores(high, low)));
    EXPECT_TRUE(std::is_eq(compareScores(low, low)));
    EXPECT_TRUE(std::is_gt(compareScores(low, high, SortPrimary::Days)));
}

TEST(Score, CompareFollowsTheChainForEachPrimary) {
    Score base;
    base.total = 100;
    base.earlyMinutes = 30;
    base.firstStart = 540;
    base.averageStart = 600;
    base.lastEnd = 900;
    base.averageEnd = 800;
    base.days = 3;
    base.freeMinutes = 60;
    const auto with = [&](auto change) {
        Score score = base;
        change(score);
        return score;
    };
    const Score cheaper = with([](Score& s) { s.total = 50; });

    EXPECT_TRUE(std::is_lt(compareScores(with([](Score& s) { s.earlyMinutes = 0; }), cheaper, SortPrimary::EarlyMinutes)));
    EXPECT_TRUE(std::is_lt(compareScores(with([](Score& s) { s.firstStart = 600; }), cheaper, SortPrimary::FirstStart)));
    EXPECT_TRUE(std::is_lt(compareScores(with([](Score& s) { s.averageStart = 660; }), cheaper, SortPrimary::FirstStart)));
    EXPECT_TRUE(std::is_lt(compareScores(with([](Score& s) { s.lastEnd = 840; }), cheaper, SortPrimary::LastEnd)));
    EXPECT_TRUE(std::is_lt(compareScores(with([](Score& s) { s.averageEnd = 700; }), cheaper, SortPrimary::LastEnd)));
    EXPECT_TRUE(std::is_lt(compareScores(with([](Score& s) { s.days = 2; }), cheaper, SortPrimary::Days)));
    EXPECT_TRUE(std::is_lt(compareScores(with([](Score& s) { s.freeMinutes = 0; }), cheaper, SortPrimary::FreeMinutes)));

    EXPECT_TRUE(std::is_gt(compareScores(with([](Score& s) { s.averageStart = 660; }), cheaper, SortPrimary::LastEnd)));
    EXPECT_TRUE(std::is_gt(compareScores(with([](Score& s) { s.averageEnd = 700; }), cheaper, SortPrimary::FirstStart)));
    EXPECT_TRUE(std::is_gt(compareScores(with([](Score& s) { s.averageEnd = 700; }), cheaper, SortPrimary::Days)));
}
