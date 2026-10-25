#include "goatplan/score.hpp"

#include <algorithm>

namespace goatplan {
    namespace {
        constexpr int kShortBreakMinutes = 10;

        int roundedAverage(int sum, int count) {
            return (2 * sum + count) / (2 * count);
        }
    }

    // The 10 minutes between back-to-back classes count as a gap too, the same
    // way for every schedule.
    Score scoreOf(const WeekMask& week, const ScoreWeights& weights) {
        Score score;
        int startSum = 0;
        int endSum = 0;
        for (int day = 0; day < 7; ++day) {
            const DaySpan span = week.daySpan(day);
            if (span.filled == 0) {
                continue;
            }
            ++score.days;
            const int start = span.first * kSlotMinutes;
            if (start < weights.earlyCutoff) {
                score.earlyMinutes += weights.earlyCutoff - start;
            }
            const int end = (span.last + 1) * kSlotMinutes;
            if (end > weights.lateCutoff) {
                score.lateMinutes += end - weights.lateCutoff;
            }
            score.gapMinutes += (span.last - span.first + 1 - span.filled) * kSlotMinutes;
            score.freeMinutes += week.breakSlots(day, kShortBreakMinutes / kSlotMinutes) * kSlotMinutes;
            score.firstStart = score.days == 1 ? start : std::min(score.firstStart, start);
            score.lastEnd = std::max(score.lastEnd, end);
            startSum += start;
            endSum += end;
        }
        if (score.days > 0) {
            score.averageStart = roundedAverage(startSum, score.days);
            score.averageEnd = roundedAverage(endSum, score.days);
        }
        score.total = score.earlyMinutes * weights.perEarlyMinute +
                      score.lateMinutes * weights.perLateMinute +
                      score.gapMinutes * weights.perGapMinute +
                      score.days * weights.perDay;
        return score;
    }

    std::strong_ordering compareScores(const Score& a, const Score& b, SortPrimary primary) {
        std::strong_ordering order = std::strong_ordering::equal;
        switch (primary) {
            case SortPrimary::EarlyMinutes:
                order = a.earlyMinutes <=> b.earlyMinutes;
                break;
            case SortPrimary::FirstStart:
                order = b.firstStart <=> a.firstStart;
                if (order == 0) {
                    order = b.averageStart <=> a.averageStart;
                }
                break;
            case SortPrimary::LastEnd:
                order = a.lastEnd <=> b.lastEnd;
                if (order == 0) {
                    order = a.averageEnd <=> b.averageEnd;
                }
                break;
            case SortPrimary::Days:
                order = a.days <=> b.days;
                break;
            case SortPrimary::FreeMinutes:
                order = a.freeMinutes <=> b.freeMinutes;
                break;
            case SortPrimary::None:
                break;
        }
        return order != 0 ? order : a.total <=> b.total;
    }
}
