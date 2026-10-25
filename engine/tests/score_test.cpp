#include <gtest/gtest.h>

#include "goatplan/score.hpp"
#include "goatplan/week_mask.hpp"

using namespace goatplan;

namespace {
constexpr int at(int hour, int minute) { return hour * 60 + minute; }

constexpr int kMon = 0;
constexpr int kWed = 2;
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
