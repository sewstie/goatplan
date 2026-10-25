#include "goatplan/score.hpp"

namespace goatplan {
    // The 10 minutes between back-to-back classes count as a gap too, the same
    // way for every schedule.
    Score scoreOf(const WeekMask& week, const ScoreWeights& weights) {
        Score score;
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
        }
        score.total = score.earlyMinutes * weights.perEarlyMinute +
                      score.lateMinutes * weights.perLateMinute +
                      score.gapMinutes * weights.perGapMinute +
                      score.days * weights.perDay;
        return score;
    }
}
